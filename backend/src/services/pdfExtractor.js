const pdfParse = require('pdf-parse');
const { performOcr, extractTextWithOcr } = require('./ocrProvider');

/**
 * Normalizes text: NFKC Unicode, smart quotes, dashes, zero-width characters,
 * CRLF to LF, and collapses excessive spaces/tabs while preserving line breaks.
 */
const normalizeText = (text) => {
  if (!text) return '';

  return text
    .normalize('NFKC')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[“”]/g, '"')
    .replace(/[‘’`]/g, "'")
    .replace(/[–—―]/g, '-')
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n');
};

/**
 * Renders page content preserving vertical structure and injecting page boundary markers.
 */
const customPageRender = (pageData) => {
  return pageData.getTextContent({ normalizeWhitespace: false }).then((textContent) => {
    let lastY = null;
    let pageText = '';

    for (const item of textContent.items) {
      if (!item || !item.str) continue;

      if (lastY === null || Math.abs(lastY - item.transform[5]) < 3) {
        pageText += item.str;
      } else {
        pageText += '\n' + item.str;
      }
      lastY = item.transform[5];
    }

    const pageNum = pageData.pageIndex + 1;
    return `\n--- PAGE_BREAK_${pageNum} ---\n` + pageText;
  });
};

/**
 * Identifies and filters out headers, footers, and page numbers repeating across pages.
 */
const filterHeadersAndFooters = (pages) => {
  if (!pages || pages.length === 0) return [];
  if (pages.length < 2) return pages;

  const lineFrequency = new Map();
  const totalPages = pages.length;

  pages.forEach((page) => {
    const uniqueLinesInPage = new Set(page.lines);
    uniqueLinesInPage.forEach((line) => {
      if (line.length > 0) {
        lineFrequency.set(line, (lineFrequency.get(line) || 0) + 1);
      }
    });
  });

  const headerFooterRegex = /^(?:Page\s*\d+(?:\s*of\s*\d+)?|\d+|\w+\s*-\s*\d+|Downloaded\s+from.*|Copyright.*|https?:\/\/.*)$/i;

  return pages.map((page) => {
    const filteredLines = page.lines.filter((line) => {
      if (headerFooterRegex.test(line)) return false;
      const count = lineFrequency.get(line) || 0;
      if (totalPages >= 3 && count / totalPages >= 0.5) {
        if (!/^(?:Q\d+|\d+[\.\)]|[A-D1-4][\.\)])/i.test(line)) {
          return false;
        }
      }
      return true;
    });

    return { ...page, lines: filteredLines };
  });
};

/**
 * Splits inline options appearing on the same line into separate lines.
 * E.g., "A. Java  B. Python  C. C++  D. Ruby" -> ["A. Java", "B. Python", "C. C++", "D. Ruby"]
 */
const splitInlineOptions = (line) => {
  if (!line || line.trim().length === 0) return [line];

  const markerRegex = /(?:^|\s+)(?:([A-Ea-e1-6])[\.\:\)\-]|[\(\[\{]([A-Ea-e1-6])[\)\]\}])\s*/g;
  const matches = [];
  let match;

  while ((match = markerRegex.exec(line)) !== null) {
    matches.push({
      index: match.index,
      marker: (match[1] || match[2]).toUpperCase(),
      length: match[0].length,
    });
  }

  if (matches.length <= 1) return [line];

  let isSequence = true;
  for (let i = 0; i < matches.length - 1; i++) {
    const charCode1 = matches[i].marker.charCodeAt(0);
    const charCode2 = matches[i + 1].marker.charCodeAt(0);
    if (charCode2 !== charCode1 + 1) {
      isSequence = false;
      break;
    }
  }

  if (!isSequence) return [line];

  const result = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i < matches.length - 1 ? matches[i + 1].index : line.length;
    const chunk = line.substring(start, end).trim();
    if (chunk.length > 0) {
      result.push(chunk);
    }
  }

  return result.length > 0 ? result : [line];
};

/**
 * Detects if PDF text is scanned / image-based.
 */
const isScannedPdf = (rawText) => {
  if (!rawText || rawText.trim().length < 50) return true;
  const clean = rawText.replace(/\s+/g, '');
  if (clean.length < 30) return true;

  const letterMatches = clean.match(/[\p{L}\p{N}]/gu) || [];
  const letterRatio = letterMatches.length / clean.length;
  return letterRatio < 0.25;
};

/**
 * Patterns & Helper detectors
 */
const detectQuestionStart = (line) => {
  const qRegex = /^(?:Q(?:uestion|\.)?\s*(\d+)|Que(?:st|\.)?\s*(\d+)|(\d{1,3})|[\(\[](\d{1,3})[\)\]])[\.\:\)\-]?\s*(.*)/i;
  const match = line.match(qRegex);
  if (!match) return null;

  const qNum = match[1] || match[2] || match[3] || match[4] || '';
  const text = match[5] ? match[5].trim() : '';

  return { qNum, text };
};

const detectOptionStart = (line, activeOptionsCount = 0) => {
  const letterRegex = /^(?:([A-Ea-e])[\.\:\)\-]|[\(\[\{]([A-Ea-e])[\)\]\}])\s*(.*)/;
  const letterMatch = line.match(letterRegex);
  if (letterMatch) {
    const letter = (letterMatch[1] || letterMatch[2]).toUpperCase();
    return { marker: letter, text: letterMatch[3] ? letterMatch[3].trim() : '' };
  }

  if (activeOptionsCount > 0 || line.startsWith('1.') || line.startsWith('1)')) {
    const numRegex = /^(?:([1-6])[\.\:\)\-]|[\(\[\{]([1-6])[\)\]\}])\s*(.*)/;
    const numMatch = line.match(numRegex);
    if (numMatch) {
      const numStr = numMatch[1] || numMatch[2];
      const letter = String.fromCharCode(64 + parseInt(numStr, 10));
      return { marker: letter, text: numMatch[3] ? numMatch[3].trim() : '' };
    }
  }

  return null;
};

const detectAnswer = (line) => {
  const ansRegex = /^(?:Ans(?:wer)?|Correct\s*Answer|Correct|Key)[\s\:\=\-]*[\(\[\{]?([A-Ea-e1-6])[\)\]\}]?/i;
  const match = line.match(ansRegex);
  if (!match) return null;

  const rawAns = match[1].toUpperCase();
  let index = null;

  if (['A', '1'].includes(rawAns)) index = 0;
  else if (['B', '2'].includes(rawAns)) index = 1;
  else if (['C', '3'].includes(rawAns)) index = 2;
  else if (['D', '4'].includes(rawAns)) index = 3;
  else if (['E', '5'].includes(rawAns)) index = 4;
  else if (['F', '6'].includes(rawAns)) index = 5;

  return index;
};

const detectExplanation = (line) => {
  const expRegex = /^(?:Explanation|Solution|Sol|Exp)[\s\:\=\-]\s*(.*)/i;
  const match = line.match(expRegex);
  if (!match) return null;
  return match[1] ? match[1].trim() : '';
};

const detectAnswerKeyHeader = (line) => {
  return /^(?:Answer\s*Key|Answers|ANSWER\s*SHEET|Key\s*Sheet)[\:\s]*$/i.test(line);
};

const parseAnswerKeySection = (lines) => {
  const ansMap = new Map();
  const pairRegex = /(?:Q(?:uestion|\.)?\s*|\b)(\d{1,3})[\s\.\:\)\-]*[\(\[\{]?([A-Ea-e1-6])[\)\]\}]?(?=\s+|$)/gi;

  lines.forEach((line) => {
    let match;
    while ((match = pairRegex.exec(line)) !== null) {
      const qNum = match[1];
      const char = match[2].toUpperCase();
      let index = null;
      if (['A', '1'].includes(char)) index = 0;
      else if (['B', '2'].includes(char)) index = 1;
      else if (['C', '3'].includes(char)) index = 2;
      else if (['D', '4'].includes(char)) index = 3;
      else if (['E', '5'].includes(char)) index = 4;

      if (index !== null) {
        ansMap.set(qNum, index);
      }
    }
  });

  return ansMap;
};

/**
 * Core State Machine Parser to extract MCQs from raw/normalized page text.
 */
function parsePdfTextToMCQs(rawText) {
  const normalized = normalizeText(rawText);
  if (!normalized || normalized.trim().length === 0) {
    return [];
  }

  const pageSegments = normalized.split(/\n?--- PAGE_BREAK_(\d+) ---\n?/);
  const pages = [];

  if (pageSegments.length > 1) {
    if (pageSegments[0].trim().length > 0) {
      const lines = pageSegments[0]
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      const expandedLines = [];
      lines.forEach((line) => {
        const split = splitInlineOptions(line);
        expandedLines.push(...split);
      });
      pages.push({ pageNum: 1, lines: expandedLines });
    }

    for (let i = 1; i < pageSegments.length; i += 2) {
      const pageNum = parseInt(pageSegments[i], 10) || (pages.length + 1);
      const content = pageSegments[i + 1] || '';
      if (content.trim().length > 0) {
        const lines = content
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        const expandedLines = [];
        lines.forEach((line) => {
          const split = splitInlineOptions(line);
          expandedLines.push(...split);
        });

        pages.push({ pageNum, lines: expandedLines });
      }
    }
  } else {
    const lines = normalized
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const expandedLines = [];
    lines.forEach((line) => {
      const split = splitInlineOptions(line);
      expandedLines.push(...split);
    });

    pages.push({ pageNum: 1, lines: expandedLines });
  }

  const cleanPages = filterHeadersAndFooters(pages);
  const extractedQuestions = [];
  let currentQuestion = null;
  let currentState = 'IDLE';
  const answerKeyLines = [];

  const finalizeQuestion = () => {
    if (currentQuestion) {
      if (currentQuestion.questionText.trim().length > 0 && currentQuestion.options.length >= 2) {
        extractedQuestions.push(currentQuestion);
      }
      currentQuestion = null;
    }
  };

  cleanPages.forEach((page) => {
    page.lines.forEach((line) => {
      if (detectAnswerKeyHeader(line) || currentState === 'ANSWER_KEY') {
        currentState = 'ANSWER_KEY';
        finalizeQuestion();
        answerKeyLines.push(line);
        return;
      }

      const ansIndex = detectAnswer(line);
      if (ansIndex !== null && currentQuestion) {
        currentQuestion.correctAnswerIndex = ansIndex;
        currentQuestion.answerSource = 'explicit';
        currentState = 'ANSWER';
        return;
      }

      const expText = detectExplanation(line);
      if (expText !== null && currentQuestion) {
        currentQuestion.explanation = expText;
        currentState = 'EXPLANATION';
        return;
      }

      const qStart = detectQuestionStart(line);
      if (qStart) {
        if (currentQuestion && (currentQuestion.options.length >= 2 || currentState === 'OPTION')) {
          finalizeQuestion();
        }

        if (!currentQuestion) {
          currentQuestion = {
            questionNumber: parseInt(qStart.qNum, 10) || (extractedQuestions.length + 1),
            qNum: qStart.qNum,
            questionText: qStart.text,
            options: [],
            correctAnswerIndex: null,
            answerSource: null,
            explanation: '',
            confidence: 'medium',
            sourcePage: page.pageNum,
            warnings: [],
          };
          currentState = 'QUESTION';
          return;
        }
      }

      const optStart = detectOptionStart(
        line,
        currentQuestion ? currentQuestion.options.length : 0
      );
      if (optStart && currentQuestion) {
        currentQuestion.options.push(optStart.text);
        currentState = 'OPTION';
        return;
      }

      if (currentQuestion) {
        if (currentState === 'QUESTION' && currentQuestion.options.length === 0) {
          currentQuestion.questionText += (currentQuestion.questionText ? ' ' : '') + line;
        } else if (currentState === 'OPTION' && currentQuestion.options.length > 0) {
          const lastIdx = currentQuestion.options.length - 1;
          currentQuestion.options[lastIdx] += ' ' + line;
        } else if (currentState === 'EXPLANATION') {
          currentQuestion.explanation += ' ' + line;
        }
      }
    });
  });

  finalizeQuestion();

  if (answerKeyLines.length > 0) {
    const ansMap = parseAnswerKeySection(answerKeyLines);
    extractedQuestions.forEach((q, idx) => {
      if (q.correctAnswerIndex === null) {
        if (q.qNum && ansMap.has(q.qNum)) {
          q.correctAnswerIndex = ansMap.get(q.qNum);
          q.answerSource = 'answer-key';
        } else if (ansMap.has(String(idx + 1))) {
          q.correctAnswerIndex = ansMap.get(String(idx + 1));
          q.answerSource = 'answer-key';
        }
      }
    });
  }

  // Deduplicate and process warnings & confidence
  const uniqueQuestions = [];
  const seenTexts = new Set();

  extractedQuestions.forEach((q) => {
    const qText = q.questionText.replace(/^[:\-]/, '').trim();
    const options = q.options.map((opt) => opt.trim()).filter((opt) => opt.length > 0);
    const cleanKey = qText.toLowerCase().replace(/[^\w]/g, '');

    if (!cleanKey || seenTexts.has(cleanKey)) return;
    seenTexts.add(cleanKey);

    const warnings = [];
    if (options.length < 4) {
      warnings.push(`Only ${options.length} options detected. Expected 4.`);
    }
    if (q.correctAnswerIndex === null) {
      warnings.push('Correct answer was not detected from the PDF.');
    }
    if (qText.length < 10) {
      warnings.push('Question text is very short.');
    }

    let confidence = 'medium';
    if (qText.length >= 10 && options.length >= 4 && q.correctAnswerIndex !== null && warnings.length === 0) {
      confidence = 'high';
    } else if (options.length < 2 || qText.length < 5 || warnings.length > 1) {
      confidence = 'low';
    }

    uniqueQuestions.push({
      questionNumber: q.questionNumber || uniqueQuestions.length + 1,
      questionText: qText,
      options,
      correctAnswerIndex: q.correctAnswerIndex,
      answerSource: q.answerSource || null,
      explanation: q.explanation.trim() || 'Extracted from uploaded PDF',
      confidence,
      warnings,
      sourcePage: q.sourcePage,
    });
  });

  return uniqueQuestions;
}

/**
 * Main Buffer Extractor entry point
 */
const extractMcqsFromBuffer = async (pdfBuffer, fileName = '') => {
  try {
    if (!pdfBuffer || pdfBuffer.length === 0) {
      return {
        success: false,
        status: 'failed',
        message: 'Empty file buffer provided',
        fileName,
        pageCount: 0,
        textLength: 0,
        questionCount: 0,
        totalExtracted: 0,
        questions: [],
        warnings: ['Provided PDF buffer is empty.'],
      };
    }

    let text = '';
    let pageCount = 0;

    try {
      const data = await pdfParse(pdfBuffer, { pagerender: customPageRender });
      text = data.text || '';
      pageCount = data.numpages || 1;
    } catch (parseError) {
      console.warn('pdfParse failed on buffer:', parseError.message);
    }

    const trimmedText = text.replace(/--- PAGE_BREAK_\d+ ---/g, '').trim();

    if (isScannedPdf(trimmedText)) {
      const ocrResult = await extractTextWithOcr(pdfBuffer) || await performOcr(pdfBuffer);
      if (ocrResult && ocrResult.text) {
        text = ocrResult.text;
      } else {
        return {
          success: false,
          status: 'no_text',
          requiresOCR: true,
          message: 'This PDF appears to be scanned/image-based and contains no extractable text. OCR processing is required.',
          fileName,
          pageCount: pageCount || 1,
          textLength: 0,
          questionCount: 0,
          totalExtracted: 0,
          questions: [],
          warnings: ['This PDF appears to be scanned or image-based and requires OCR.'],
          error: 'This PDF appears to be scanned/image-based. OCR is required.',
        };
      }
    }

    const questions = parsePdfTextToMCQs(text);
    const warnings = [];

    if (questions.length === 0) {
      warnings.push('No valid multiple-choice questions could be detected in this document.');
    } else {
      const missingAnsCount = questions.filter((q) => q.correctAnswerIndex === null).length;
      if (missingAnsCount > 0) {
        warnings.push(`${missingAnsCount} question(s) extracted without explicit answer keys. Please review and select correct answers.`);
      }
    }

    const statistics = {
      highConfidence: questions.filter((q) => q.confidence === 'high').length,
      mediumConfidence: questions.filter((q) => q.confidence === 'medium').length,
      lowConfidence: questions.filter((q) => q.confidence === 'low').length,
      withoutAnswer: questions.filter((q) => q.correctAnswerIndex === null).length,
    };

    const status = questions.length > 0 ? (warnings.length > 0 ? 'partial' : 'success') : 'failed';

    return {
      success: questions.length > 0,
      status,
      message: questions.length > 0
        ? `Successfully extracted ${questions.length} question(s) from PDF.`
        : 'Could not extract valid MCQs from the provided document format.',
      fileName,
      pageCount,
      textLength: text.length,
      questionCount: questions.length,
      totalExtracted: questions.length,
      statistics,
      questions,
      warnings,
    };
  } catch (error) {
    console.error('PDF extraction error:', error);
    return {
      success: false,
      status: 'failed',
      message: error.message || 'Could not parse text from this PDF file.',
      fileName,
      pageCount: 0,
      textLength: 0,
      questionCount: 0,
      totalExtracted: 0,
      questions: [],
      warnings: [error.message || 'PDF processing encountered a fatal error.'],
      error: error.message || 'Could not parse text from this PDF file.',
    };
  }
};

module.exports = {
  extractMcqsFromBuffer,
  parsePdfTextToMCQs,
  splitInlineOptions,
  normalizeText,
  isScannedPdf,
};
