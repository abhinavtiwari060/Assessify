const pdfParse = require('pdf-parse');

/**
 * Heuristic parser to extract MCQs from raw PDF text
 * Detects patterns like:
 * Q1. What is Java?
 * A. Language
 * B. Coffee
 * C. OS
 * D. DB
 * Answer: A
 */
const parsePdfTextToMCQs = (rawText) => {
  if (!rawText || rawText.trim().length === 0) {
    return [];
  }

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const extractedQuestions = [];
  let currentQuestion = null;

  // Regex patterns
  const questionRegex = /^(?:Q(?:uestion|\.)?\s*\d+[\.\:\)\-]?|\d+[\.\)])\s*(.+)/i;
  const optionRegex = /^(?:[A-D1-4][\.\:\)\-]\s*|[\(\[\{][A-D1-4][\)\]\}]\s*)(.+)/i;
  const answerRegex = /^(?:Ans(?:wer)?|Correct\s*Answer|Key)[\:\=]?\s*([A-D1-4])/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line matches an explicit Answer pattern first
    const ansMatch = line.match(answerRegex);
    if (ansMatch && currentQuestion) {
      const char = ansMatch[1].toUpperCase();
      let index = 0;
      if (['A', '1'].includes(char)) index = 0;
      else if (['B', '2'].includes(char)) index = 1;
      else if (['C', '3'].includes(char)) index = 2;
      else if (['D', '4'].includes(char)) index = 3;

      currentQuestion.correctAnswerIndex = index;
      continue;
    }

    // Check if line starts a new Question
    const qMatch = line.match(questionRegex);
    if (qMatch) {
      if (currentQuestion && currentQuestion.options.length >= 2) {
        extractedQuestions.push(currentQuestion);
      }

      currentQuestion = {
        questionText: qMatch[1] || line,
        options: [],
        correctAnswerIndex: 0,
        explanation: 'Extracted from uploaded PDF',
        confidence: 'medium',
      };
      continue;
    }

    // Check if line is an Option
    const optMatch = line.match(optionRegex);
    if (optMatch && currentQuestion) {
      currentQuestion.options.push(optMatch[1] || line);
      continue;
    }

    // If we have an active question and line doesn't match option or answer, append to question text or last option
    if (currentQuestion) {
      if (currentQuestion.options.length === 0) {
        currentQuestion.questionText += ' ' + line;
      } else {
        // Append to last option if option was wrapped onto multiple lines
        const lastIdx = currentQuestion.options.length - 1;
        currentQuestion.options[lastIdx] += ' ' + line;
      }
    }
  }

  // Push the final question if valid
  if (currentQuestion && currentQuestion.options.length >= 2) {
    extractedQuestions.push(currentQuestion);
  }

  // Fallback: If heuristic failed to find structure, split text into paragraph blocks and offer template extractions
  if (extractedQuestions.length === 0) {
    const paragraphs = rawText.split(/\n\s*\n/).filter((p) => p.trim().length > 20);
    paragraphs.slice(0, 10).forEach((para, idx) => {
      extractedQuestions.push({
        questionText: para.trim(),
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswerIndex: 0,
        explanation: `Parsed from section #${idx + 1}`,
        confidence: 'low',
      });
    });
  }

  return extractedQuestions;
};

const extractMcqsFromBuffer = async (pdfBuffer) => {
  try {
    let text = '';
    let pageCount = 1;

    try {
      const data = await pdfParse(pdfBuffer);
      text = data.text || '';
      pageCount = data.numpages || 1;
    } catch (parseError) {
      console.warn('pdfParse failed on buffer, using raw text decoder fallback:', parseError.message);
      // Fallback to text decoding
      text = pdfBuffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
    }

    let questions = parsePdfTextToMCQs(text);

    // Final safety fallback: If no questions parsed, create 3 structured placeholder question cards for teacher review
    if (questions.length === 0) {
      questions = [
        {
          questionText: 'Sample Extracted Question #1 (Review and edit statement)',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswerIndex: 0,
          explanation: 'Auto-generated template for review',
          confidence: 'low',
        },
        {
          questionText: 'Sample Extracted Question #2 (Review and edit statement)',
          options: ['Option A', 'Option B', 'Option C', 'Option D'],
          correctAnswerIndex: 1,
          explanation: 'Auto-generated template for review',
          confidence: 'low',
        },
      ];
    }

    return {
      success: true,
      textLength: text.length,
      pageCount,
      questions,
    };
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Could not parse text from this PDF file. Please ensure it is a valid text-based PDF or question paper.');
  }
};

module.exports = { extractMcqsFromBuffer, parsePdfTextToMCQs };
