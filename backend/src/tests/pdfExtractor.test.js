const test = require('node:test');
const assert = require('node:assert/strict');
const { parsePdfTextToMCQs, extractMcqsFromBuffer, isScannedPdf, normalizeText } = require('../services/pdfExtractor');

test('Text Normalization: NFKC, smart quotes, dashes, CRLF, zero-width chars', () => {
  const input = "Q1. “What is Java?” – Answer: ‘A’\r\nLine 2";
  const output = normalizeText(input);
  assert.equal(output.includes('"What is Java?"'), true);
  assert.equal(output.includes("- Answer: 'A'"), true);
  assert.equal(output.includes('\r'), false);
});

test('Case A: Standard Q1. A/B/C/D format with explicit answer', () => {
  const text = `
    Q1. What is Java?
    A. Programming language
    B. Database
    C. Operating System
    D. Browser
    Answer: A
  `;
  const res = parsePdfTextToMCQs(text);
  assert.equal(res.length, 1);
  assert.equal(res[0].questionText, 'What is Java?');
  assert.equal(res[0].options.length, 4);
  assert.equal(res[0].correctAnswerIndex, 0);
  assert.equal(res[0].answerSource, 'explicit');
  assert.equal(res[0].confidence, 'high');
});

test('Case B: 1) format with numeric answer Ans: B', () => {
  const text = `
    1) What is 2 + 2?
    A) 3
    B) 4
    C) 5
    D) 6
    Ans: B
  `;
  const res = parsePdfTextToMCQs(text);
  assert.equal(res.length, 1);
  assert.equal(res[0].questionText, 'What is 2 + 2?');
  assert.equal(res[0].correctAnswerIndex, 1);
});

test('Case C: Multiline question text continuation', () => {
  const text = `
    1. Which of the following is
    the correct definition of
    object oriented programming?
    A. Paradigm based on objects
    B. Functional style
    C. Assembly language
    D. Scripting tool
    Correct Answer = A
  `;
  const res = parsePdfTextToMCQs(text);
  assert.equal(res.length, 1);
  assert.equal(
    res[0].questionText,
    'Which of the following is the correct definition of object oriented programming?'
  );
});

test('Case D: Multiline option text continuation', () => {
  const text = `
    Q1. What is Node.js?
    A. JavaScript runtime environment
       built on Chrome's V8 engine
    B. Database engine
    C. CSS preprocessor
    D. Operating System kernel
    Ans: A
  `;
  const res = parsePdfTextToMCQs(text);
  assert.equal(res.length, 1);
  assert.equal(
    res[0].options[0],
    "JavaScript runtime environment built on Chrome's V8 engine"
  );
});

test('Case E: Q.1 format', () => {
  const text = `
    Q.1 What is Python?
    A. High level language
    B. Low level language
    C. Machine code
    D. Hardware component
    Key: A
  `;
  const res = parsePdfTextToMCQs(text);
  assert.equal(res.length, 1);
  assert.equal(res[0].questionText, 'What is Python?');
  assert.equal(res[0].correctAnswerIndex, 0);
});

test('Case F: Question 1 format', () => {
  const text = `
    Question 1: What is HTML?
    A. Markup language
    B. Style sheet
    C. Programming language
    D. Database
    Correct: A
  `;
  const res = parsePdfTextToMCQs(text);
  assert.equal(res.length, 1);
  assert.equal(res[0].questionText, 'What is HTML?');
  assert.equal(res[0].correctAnswerIndex, 0);
});

test('Case G: Separate Answer Key section at end of PDF', () => {
  const text = `
    1. What is CSS?
    A. Styling
    B. Database
    C. Protocol
    D. Compiler

    2. What is SQL?
    A. Query language
    B. OS
    C. Browser
    D. Hardware

    Answer Key
    1-A
    2-A
  `;
  const res = parsePdfTextToMCQs(text);
  assert.equal(res.length, 2);
  assert.equal(res[0].correctAnswerIndex, 0);
  assert.equal(res[0].answerSource, 'answer-key');
  assert.equal(res[1].correctAnswerIndex, 0);
  assert.equal(res[1].answerSource, 'answer-key');
});

test('Case H: Missing answer (correctAnswerIndex is null)', () => {
  const text = `
    Q1. What is C++?
    A. Language
    B. OS
    C. DB
    D. Server
  `;
  const res = parsePdfTextToMCQs(text);
  assert.equal(res.length, 1);
  assert.equal(res[0].correctAnswerIndex, null);
  assert.equal(res[0].answerSource, null);
  assert.ok(res[0].warnings.some((w) => w.includes('not detected')));
});

test('Case I: Three-option question generates warning', () => {
  const text = `
    Q1. Is Earth round?
    A. Yes
    B. No
    C. Unsure
    Answer: A
  `;
  const res = parsePdfTextToMCQs(text);
  assert.equal(res.length, 1);
  assert.equal(res[0].options.length, 3);
  assert.ok(res[0].warnings.some((w) => w.includes('3 options')));
});

test('Case J: Duplicate question removal', () => {
  const text = `
    Q1. What is Java?
    A. Language
    B. DB
    C. OS
    D. Browser
    Ans: A

    Q2. What is Java?
    A. Language
    B. DB
    C. OS
    D. Browser
    Ans: A
  `;
  const res = parsePdfTextToMCQs(text);
  assert.equal(res.length, 1);
});

test('Case K: Header and footer filtering across pages', () => {
  const text = `
    Page 1 of 10
    Confidential Examination Paper
    Q1. What is HTTP?
    A. Protocol
    B. Database
    C. Compiler
    D. Language
    Answer: A
    --- PAGE 1 ---
  `;
  const res = parsePdfTextToMCQs(text);
  assert.equal(res.length, 1);
  assert.equal(res[0].questionText, 'What is HTTP?');
});

test('Case L: Empty / no-text PDF handling', () => {
  const res = parsePdfTextToMCQs('');
  assert.equal(res.length, 0);
});

test('Case M: Scanned/image-based PDF detection', async () => {
  const fakeScannedBuffer = Buffer.from('PDF_HEADER_IMAGE_DATA_ONLY_\x00\x01\x02\x03\x04\x05');
  const res = await extractMcqsFromBuffer(fakeScannedBuffer);
  assert.equal(res.success, false);
  assert.equal(res.requiresOCR, true);
  assert.equal(res.questions.length, 0);
});

test('Case N: Completely unstructured PDF text returns success: false with no fake questions', () => {
  const text = "Random document text without any question structure or options.";
  const res = parsePdfTextToMCQs(text);
  assert.equal(res.length, 0); // MUST NEVER GENERATE FAKE SAMPLE QUESTIONS!
});
