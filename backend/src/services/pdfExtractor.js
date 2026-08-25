const pdfParse = require('pdf-parse');
const { extractTextWithOcr } = require('./ocrProvider');

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
      // If line appears in 50%+ of pages and doesn't look like a standard question/option line
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

  // Regex to match option prefixes like A., B), (C), [D], 1., 2)
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

  // Verify if markers form a sequence (A, B, C or 1, 2, 3)
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
  // Letter option match: A., B), (C), [D], a., b)
  const letterRegex = /^(?:([A-Ea-e])[\.\:\)\-]|[\(\[\{]([A-Ea-e])[\)\]\}])\s*(.*)/;
  const letterMatch = line.match(letterRegex);
  if (letterMatch) {
    const letter = (letterMatch[1] || letterMatch[2]).toUpperCase();
    return { marker: letter, text: letterMatch[3] ? letterMatch[3].trim() : '' };
  }

  // Numeric option match when in active question context: 1., 2), (1), [1]
  if (activeOptionsCount > 0 || line.startsWith('1.') || line.startsWith('1)')) {
    const numRegex = /^(?:([1-6])[\.\:\)\-]|[\(\[\{]([1-6])[\)\]\}])\s*(.*)/;
    const numMatch = line.match(numRegex);
    if (numMatch) {
      const numStr = numMatch[1] || numMatch[2];
      const letter = String.fromCharCode(64 + parseInt(numStr, 10)); // 1 -> A, 2 -> B
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
const parsePdfTextToMCQs = (rawText) => {
  if (!rawText || rawText.trim().length === 0) {
    return [];
  }

  const normalized = normalizeText(rawText);

  // Split pages by break markers
  const pageParts = normalized.split(/\n?--- PAGE_BREAK_(\d+) ---\n?/);
  const pages = [];

  if (pageParts.length > 1) {
    for (let i = 1; i < pageParts.length; i += 2) {
      const pageNum = parseInt(pageParts[i], 10) || (pages.length + 1);
      const content = pageParts[i + 1] || '';
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
  let currentState = 'IDLE'; // IDLE, QUESTION, OPTION, ANSWER, EXPLANATION, ANSWER_KEY
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
      // 1. Check if we entered Answer Key section
      if (detectAnswerKeyHeader(line) || currentState === 'ANSWER_KEY') {
        currentState = 'ANSWER_KEY';
        finalizeQuestion();
        answerKeyLines.push(line);
        return;
      }

      // 2. Check Answer line
      const ansIndex = detectAnswer(line);
      if (ansIndex !== null && currentQuestion) {
        currentQuestion.correctAnswerIndex = ansIndex;
        currentState = 'ANSWER';
        return;
      }

      // 3. Check Explanation line
      const expText = detectExplanation(line);
      if (expText !== null && currentQuestion) {
        currentQuestion.explanation = expText;
        currentState = 'EXPLANATION';
        return;
      }

      // 4. Check Question start line
      const qStart = detectQuestionStart(line);
      if (qStart) {
        // If we are in OPTION/ANSWER state or have valid question, finalize current
        if (currentQuestion && (currentQuestion.options.length >= 2 || currentState === 'OPTION')) {
          finalizeQuestion();
        }

        if (!currentQuestion) {
          currentQuestion = {
            qNum: qStart.qNum,
            questionText: qStart.text,
            options: [],
            correctAnswerIndex: null,
            explanation: '',
            confidence: 'medium',
            sourcePage: page.pageNum,
          };
          currentState = 'QUESTION';
          return;
        }
      }

      // 5. Check Option start line
      const optStart = detectOptionStart(
        line,
        currentQuestion ? currentQuestion.options.length : 0
      );
      if (optStart && currentQuestion) {
        currentQuestion.options.push(optStart.text);
        currentState = 'OPTION';
        return;
      }

      // 6. Multiline state continuation logic
      if (currentQuestion) {
        if (currentState === 'QUESTION' && currentQuestion.options.length === 0) {
          // Append to question text
          currentQuestion.questionText += (currentQuestion.questionText ? ' ' : '') + line;
        } else if (currentState === 'OPTION' && currentQuestion.options.length > 0) {
          // Append to last option
          const lastIdx = currentQuestion.options.length - 1;
          currentQuestion.options[lastIdx] += ' ' + line;
        } else if (currentState === 'EXPLANATION') {
          currentQuestion.explanation += ' ' + line;
        }
      }
    });
  });

  // Finalize last question
  finalizeQuestion();

  // Parse Answer Key section if present
  if (answerKeyLines.length > 0) {
    const ansMap = parseAnswerKeySection(answerKeyLines);
    extractedQuestions.forEach((q, idx) => {
      if (q.correctAnswerIndex === null) {
        if (q.qNum && ansMap.has(q.qNum)) {
          q.correctAnswerIndex = ansMap.get(q.qNum);
        } else if (ansMap.has(String(idx + 1))) {
          q.correctAnswerIndex = ansMap.get(String(idx + 1));
        }
      }
    });
  }

  // Post-processing, cleaning & confidence scoring
  const cleanedQuestions = extractedQuestions
    .map((q) => {
      const qText = q.questionText.replace(/^[:\-]/, '').trim();
      const options = q.options.map((opt) => opt.trim()).filter((opt) => opt.length > 0);

      let confidence = 'medium';
      if (qText.length >= 10 && options.length >= 4 && q.correctAnswerIndex !== null) {
        confidence = 'high';
      } else if (options.length < 2 || qText.length < 5) {
        confidence = 'low';
      }

      return {
        questionText: qText,
        options,
        correctAnswerIndex: q.correctAnswerIndex,
        explanation: q.explanation.trim() || 'Extracted from uploaded PDF',
        confidence,
        sourcePage: q.sourcePage,
      };
    })
    .filter((q) => q.questionText.length > 0 && q.options.length >= 2);

  return cleanedQuestions;
};

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

    // Check if PDF contains no meaningful extractable text (Scanned / Image PDF)
    if (!trimmedText || trimmedText.length < 20) {
      // Attempt OCR if provider available
      const ocrResult = await extractTextWithOcr(pdfBuffer);
      if (ocrResult && ocrResult.text) {
        text = ocrResult.text;
      } else {
        return {
          success: false,
          status: 'no_text',
          message: 'This PDF appears to be scanned/image-based and contains no extractable text. OCR processing is required.',
          fileName,
          pageCount: pageCount || 1,
          textLength: 0,
          totalExtracted: 0,
          questions: [],
          warnings: ['This PDF appears to be scanned or image-based and requires OCR.'],
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
      totalExtracted: questions.length,
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
      totalExtracted: 0,
      questions: [],
      warnings: [error.message || 'PDF processing encountered a fatal error.'],
    };
  }
};

module.exports = {
  extractMcqsFromBuffer,
  parsePdfTextToMCQs,
  splitInlineOptions,
  normalizeText,
};
