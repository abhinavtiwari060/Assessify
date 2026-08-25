const pdfParse = require('pdf-parse');
const { performOcr } = require('./ocrProvider');

/**
 * Normalizes Unicode text (NFKC), smart quotes, dashes, CRLF line endings.
 */
function normalizeText(text) {
  if (!text) return '';
  return text
    .normalize('NFKC')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

/**
 * Detects if PDF appears to be scanned/image-based or lacks readable text.
 */
function isScannedPdf(rawText) {
  if (!rawText || rawText.trim().length < 50) return true;
  const clean = rawText.replace(/\s+/g, '');
  if (clean.length < 30) return true;

  const letterMatches = clean.match(/[\p{L}\p{N}]/gu) || [];
  const letterRatio = letterMatches.length / clean.length;
  return letterRatio < 0.25;
}

/**
 * Filters common PDF header/footer/page number noise.
 */
function isHeaderFooterOrNoise(line) {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (/^--- PAGE \d+ ---$/i.test(trimmed)) return true;
  if (/^Page \d+(?: of \d+)?$/i.test(trimmed)) return true;
  if (/^\d+\s*\/\s*\d+$/i.test(trimmed)) return true;
  if (/^(?:Confidential|Copyright|All Rights Reserved|Printed on|Document ID)[\.\:]?/i.test(trimmed)) return true;
  return false;
}

/**
 * Splits inline options present on a single line (e.g. "A. Red B. Blue C. Green D. Yellow").
 */
function splitInlineOptions(line) {
  const inlineOptionMarkerRegex = /(?:^|\s+)(?:([A-E1-5])[\.\:\)\-]|[\(\[\{]([A-E1-5])[\)\]\}])\s+/g;
  const matches = [...line.matchAll(inlineOptionMarkerRegex)];

  if (matches.length >= 2) {
    const parts = [];
    for (let i = 0; i < matches.length; i++) {
      const currentMatch = matches[i];
      const nextMatch = matches[i + 1];
      const startIdx = currentMatch.index;
      const endIdx = nextMatch ? nextMatch.index : line.length;

      const optionContent = line.substring(startIdx, endIdx).trim();
      if (optionContent) {
        parts.push(optionContent);
      }
    }
    return parts;
  }
  return [line];
}

/**
 * Maps option letter or number string to 0-based index.
 */
function parseOptionLetterOrNum(charStr) {
  if (!charStr) return null;
  const upper = charStr.trim().toUpperCase();
  if (['A', '1'].includes(upper)) return 0;
  if (['B', '2'].includes(upper)) return 1;
  if (['C', '3'].includes(upper)) return 2;
  if (['D', '4'].includes(upper)) return 3;
  if (['E', '5'].includes(upper)) return 4;
  return null;
}

/**
 * Parses raw text into structured MCQ objects using a robust state machine parser.
 */
function parsePdfTextToMCQs(rawText) {
  const normalized = normalizeText(rawText);
  if (!normalized || normalized.trim().length === 0) {
    return [];
  }

  const rawLines = normalized.split('\n');
  const lines = [];

  // Expand lines with inline options
  for (const rLine of rawLines) {
    const trimmed = rLine.trim();
    if (isHeaderFooterOrNoise(trimmed)) continue;

    const inlineParts = splitInlineOptions(trimmed);
    for (const part of inlineParts) {
      if (part.trim()) {
        lines.push(part.trim());
      }
    }
  }

  const extractedQuestions = [];
  const answerKeyMap = new Map(); // Maps questionNumber -> optionIndex
  let currentQuestion = null;
  let inAnswerKeySection = false;

  // Regex patterns
  const questionHeaderRegex = /^(?:Q(?:uestion)?(?:\s*No\.?)?\s*[\:\.]?\s*(\d+)[\.\:\)\-]?|\b(\d+)[\.\:\)\-])\s*(.*)/i;
  const optionRegex = /^(?:([A-E1-5])[\.\:\)\-]|[\(\[\{]([A-E1-5])[\)\]\}])\s*(.*)/i;
  const answerRegex = /^(?:Ans(?:wer)?|Correct\s*Answer|Key|Correct)[\:\=\s]+[\(\[\{]?([A-E1-5])[\)\]\}]?/i;
  const explanationRegex = /^(?:Explanation|Note|Details)[\:\=]\s*(.*)/i;
  const answerKeySectionHeaderRegex = /^(?:Answer\s*Keys?|Answers|Key\s*Sheet)$/i;

  const pushCurrentQuestion = () => {
    if (currentQuestion && currentQuestion.options.length >= 2) {
      extractedQuestions.push(currentQuestion);
    }
    currentQuestion = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect start of Answer Key section at end of PDF
    if (answerKeySectionHeaderRegex.test(line)) {
      pushCurrentQuestion();
      inAnswerKeySection = true;
      continue;
    }

    if (inAnswerKeySection) {
      // Parse answer key format (e.g. 1-A 2-C 3-B or 1. A 2. B)
      const keyPairMatches = [...line.matchAll(/(?:(\d+)[\.\:\)\-]*\s*[\:\=\-]?\s*([A-E1-5]))/gi)];
      for (const kMatch of keyPairMatches) {
        const qNum = parseInt(kMatch[1], 10);
        const optIdx = parseOptionLetterOrNum(kMatch[2]);
        if (!isNaN(qNum) && optIdx !== null) {
          answerKeyMap.set(qNum, optIdx);
        }
      }
      continue;
    }

    // 1. Check for Explanation line
    const expMatch = line.match(explanationRegex);
    if (expMatch && currentQuestion) {
      currentQuestion.explanation = expMatch[1] || line;
      continue;
    }

    // 2. Check for explicit Answer line inside question block
    const ansMatch = line.match(answerRegex);
    if (ansMatch && currentQuestion) {
      const optIdx = parseOptionLetterOrNum(ansMatch[1]);
      if (optIdx !== null) {
        currentQuestion.correctAnswerIndex = optIdx;
        currentQuestion.answerSource = 'explicit';
      }
      continue;
    }

    // 3. Check for new Question header
    const qMatch = line.match(questionHeaderRegex);
    if (qMatch) {
      pushCurrentQuestion();

      const qNum = parseInt(qMatch[1] || qMatch[2], 10);
      const qText = qMatch[3] ? qMatch[3].trim() : '';

      currentQuestion = {
        questionNumber: !isNaN(qNum) ? qNum : extractedQuestions.length + 1,
        questionText: qText,
        options: [],
        correctAnswerIndex: null,
        answerSource: null,
        explanation: 'Extracted from uploaded PDF',
        confidence: 'medium',
        warnings: [],
      };
      continue;
    }

    // 4. Check for Option line
    const optMatch = line.match(optionRegex);
    if (optMatch && currentQuestion) {
      const optText = optMatch[3] ? optMatch[3].trim() : line;
      currentQuestion.options.push(optText);
      continue;
    }

    // 5. Continuation lines (multi-line questions or multi-line options)
    if (currentQuestion) {
      if (currentQuestion.options.length === 0) {
        currentQuestion.questionText = (currentQuestion.questionText + ' ' + line).trim();
      } else {
        const lastIdx = currentQuestion.options.length - 1;
        currentQuestion.options[lastIdx] = (currentQuestion.options[lastIdx] + ' ' + line).trim();
      }
    }
  }

  // Push the final question
  pushCurrentQuestion();

  // Apply Answer Key section matches if question has no explicit answer
  for (const q of extractedQuestions) {
    if (q.correctAnswerIndex === null && answerKeyMap.has(q.questionNumber)) {
      q.correctAnswerIndex = answerKeyMap.get(q.questionNumber);
      q.answerSource = 'answer-key';
    }
  }

  // Deduplicate questions based on normalized question text
  const uniqueQuestions = [];
  const seenTexts = new Set();

  for (const q of extractedQuestions) {
    const cleanKey = q.questionText.toLowerCase().replace(/[^\w]/g, '');
    if (!cleanKey || seenTexts.has(cleanKey)) continue;
    seenTexts.add(cleanKey);

    // Generate warnings & calculate confidence
    q.warnings = [];
    if (q.options.length < 4) {
      q.warnings.push(`Only ${q.options.length} options detected. Expected 4.`);
    }
    if (q.correctAnswerIndex === null) {
      q.warnings.push('Correct answer was not detected from the PDF.');
    }
    if (q.questionText.length < 10) {
      q.warnings.push('Question text is very short.');
    }

    // Determine confidence score
    if (
      q.questionText.length >= 10 &&
      q.options.length >= 4 &&
      q.correctAnswerIndex !== null &&
      q.warnings.length === 0
    ) {
      q.confidence = 'high';
    } else if (q.options.length >= 3 && q.questionText.length >= 10 && q.warnings.length <= 1) {
      q.confidence = 'medium';
    } else {
      q.confidence = 'low';
    }

    uniqueQuestions.push(q);
  }

  return uniqueQuestions;
}

/**
 * Main PDF buffer extraction entry point.
 */
const extractMcqsFromBuffer = async (pdfBuffer) => {
  try {
    let text = '';
    let pageCount = 1;

    try {
      const renderPage = (pageData) => {
        return pageData.getTextContent().then((textContent) => {
          let lastY, pageText = '';
          for (let item of textContent.items) {
            if (lastY == item.transform[4] || !lastY) {
              pageText += item.str + ' ';
            } else {
              pageText += '\n' + item.str + ' ';
            }
            lastY = item.transform[4];
          }
          return `\n--- PAGE ${pageData.pageIndex + 1} ---\n` + pageText;
        });
      };

      const data = await pdfParse(pdfBuffer, { pagerender: renderPage });
      text = data.text || '';
      pageCount = data.numpages || 1;
    } catch (parseError) {
      console.warn('pdfParse failed on buffer, trying fallback OCR provider:', parseError.message);
      const ocrResult = await performOcr(pdfBuffer);
      if (ocrResult.performedOcr && ocrResult.text) {
        text = ocrResult.text;
      }
    }

    // Check if PDF is scanned or lacks text
    if (isScannedPdf(text)) {
      return {
        success: false,
        requiresOCR: true,
        textLength: text.length,
        pageCount,
        questions: [],
        error: 'This PDF appears to be scanned/image-based. OCR is required.',
      };
    }

    const questions = parsePdfTextToMCQs(text);

    if (questions.length === 0) {
      return {
        success: false,
        requiresOCR: false,
        textLength: text.length,
        pageCount,
        questions: [],
        error: 'No valid MCQs could be detected from the extracted PDF text.',
      };
    }

    const statistics = {
      highConfidence: questions.filter((q) => q.confidence === 'high').length,
      mediumConfidence: questions.filter((q) => q.confidence === 'medium').length,
      lowConfidence: questions.filter((q) => q.confidence === 'low').length,
      withoutAnswer: questions.filter((q) => q.correctAnswerIndex === null).length,
    };

    return {
      success: true,
      textLength: text.length,
      pageCount,
      questionCount: questions.length,
      statistics,
      questions,
    };
  } catch (error) {
    console.error('PDF extraction service error:', error);
    return {
      success: false,
      questions: [],
      error: error.message || 'Could not parse text from this PDF file.',
    };
  }
};

module.exports = { extractMcqsFromBuffer, parsePdfTextToMCQs, normalizeText, isScannedPdf };
