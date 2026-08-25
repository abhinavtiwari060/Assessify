const test = require('node:test');
const assert = require('node:assert/strict');
const { parsePdfTextToMCQs, splitInlineOptions, normalizeText, extractMcqsFromBuffer } = require('../services/pdfExtractor');

test('Text Normalization: NFKC, smart quotes, dashes, CRLF, zero-width chars', () => {
  const raw = "Q1. “What is Java?” – \r\nA. Language\u200B\u00A0";
  const normalized = normalizeText(raw);
  assert.equal(normalized, 'Q1. "What is Java?" -\nA. Language');
});

test('Inline Options Splitting: Letters A-D on same line', () => {
  const line = 'A. Option A   B. Option B   C. Option C   D. Option D';
  const split = splitInlineOptions(line);
  assert.deepEqual(split, [
    'A. Option A',
    'B. Option B',
    'C. Option C',
    'D. Option D',
  ]);
});

test('Inline Options Splitting: Parentheses (A)-(D) on same line', () => {
  const line = '(A) Option A  (B) Option B  (C) Option C  (D) Option D';
  const split = splitInlineOptions(line);
  assert.deepEqual(split, [
    '(A) Option A',
    '(B) Option B',
    '(C) Option C',
    '(D) Option D',
  ]);
});

test('Inline Options Splitting: Numbers 1-4 on same line', () => {
  const line = '1) Option 1   2) Option 2   3) Option 3   4) Option 4';
  const split = splitInlineOptions(line);
  assert.deepEqual(split, [
    '1) Option 1',
    '2) Option 2',
    '3) Option 3',
    '4) Option 4',
  ]);
});

test('Case 1: Standard Q1. A/B/C/D format with explicit answer', () => {
  const text = `
--- PAGE_BREAK_1 ---
Q1. What is Java?
A. Language
B. Coffee
C. OS
D. Database
Answer: A
  `;

  const mcqs = parsePdfTextToMCQs(text);
  assert.equal(mcqs.length, 1);
  assert.equal(mcqs[0].questionText, 'What is Java?');
  assert.deepEqual(mcqs[0].options, ['Language', 'Coffee', 'OS', 'Database']);
  assert.equal(mcqs[0].correctAnswerIndex, 0);
  assert.equal(mcqs[0].confidence, 'high');
});

test('Case 2: 1) format with numeric answer', () => {
  const text = `
--- PAGE_BREAK_1 ---
1) What is 2 + 2?
A) 3
B) 4
C) 5
D) 6
Ans: B
  `;

  const mcqs = parsePdfTextToMCQs(text);
  assert.equal(mcqs.length, 1);
  assert.equal(mcqs[0].questionText, 'What is 2 + 2?');
  assert.deepEqual(mcqs[0].options, ['3', '4', '5', '6']);
  assert.equal(mcqs[0].correctAnswerIndex, 1);
  assert.equal(mcqs[0].confidence, 'high');
});

test('Case 3: Parentheses options (A)-(D) without answer', () => {
  const text = `
--- PAGE_BREAK_1 ---
12. Which language is used for web development?
(A) JavaScript
(B) Python
(C) C++
(D) Assembly
  `;

  const mcqs = parsePdfTextToMCQs(text);
  assert.equal(mcqs.length, 1);
  assert.equal(mcqs[0].questionText, 'Which language is used for web development?');
  assert.deepEqual(mcqs[0].options, ['JavaScript', 'Python', 'C++', 'Assembly']);
  assert.equal(mcqs[0].correctAnswerIndex, null);
  assert.equal(mcqs[0].confidence, 'medium');
});

test('Case 4: Question prefix on own line followed by statement', () => {
  const text = `
--- PAGE_BREAK_1 ---
Question 5.
Which of the following is correct?
A. Option one
B. Option two
C. Option three
D. Option four
Answer: C
  `;

  const mcqs = parsePdfTextToMCQs(text);
  assert.equal(mcqs.length, 1);
  assert.equal(mcqs[0].questionText, 'Which of the following is correct?');
  assert.equal(mcqs[0].correctAnswerIndex, 2);
});

test('Case 5: Inline options on a single line', () => {
  const text = `
--- PAGE_BREAK_1 ---
12. Which of the following is a programming language?
A. JavaScript   B. MySQL   C. HTML   D. CSS
Ans: A
  `;

  const mcqs = parsePdfTextToMCQs(text);
  assert.equal(mcqs.length, 1);
  assert.equal(mcqs[0].questionText, 'Which of the following is a programming language?');
  assert.deepEqual(mcqs[0].options, ['JavaScript', 'MySQL', 'HTML', 'CSS']);
  assert.equal(mcqs[0].correctAnswerIndex, 0);
});

test('Case 6: Multiline question and option text', () => {
  const text = `
--- PAGE_BREAK_1 ---
1. Which of the following is used for
   creating objects in Java?
A. This is a very long option that continues
   on the next line.
B. Short option
C. Option three
D. Option four
Answer: A
  `;

  const mcqs = parsePdfTextToMCQs(text);
  assert.equal(mcqs.length, 1);
  assert.equal(mcqs[0].questionText, 'Which of the following is used for creating objects in Java?');
  assert.equal(mcqs[0].options[0], 'This is a very long option that continues on the next line.');
});

test('Case 7: Explanation block extraction', () => {
  const text = `
--- PAGE_BREAK_1 ---
Q1. What is Node.js?
A. Runtime
B. Framework
C. DB
D. OS
Answer: A
Explanation: Node.js is an open-source JavaScript runtime environment.
  `;

  const mcqs = parsePdfTextToMCQs(text);
  assert.equal(mcqs.length, 1);
  assert.equal(mcqs[0].explanation, 'Node.js is an open-source JavaScript runtime environment.');
});

test('Case 8: Answer Key section at the end of document', () => {
  const text = `
--- PAGE_BREAK_1 ---
1. What is HTML?
A. Markup
B. Scripting
C. Styling
D. Querying

2. What is CSS?
A. Styling
B. Logic
C. Data
D. Network

--- PAGE_BREAK_2 ---
Answer Key:
1-A
2-A
  `;

  const mcqs = parsePdfTextToMCQs(text);
  assert.equal(mcqs.length, 2);
  assert.equal(mcqs[0].correctAnswerIndex, 0);
  assert.equal(mcqs[1].correctAnswerIndex, 0);
});

test('Case 9: Header and footer filtering across pages', () => {
  const text = `
--- PAGE_BREAK_1 ---
Downloaded from www.testbank.com
Page 1 of 2
1. Question one?
A. Opt 1
B. Opt 2
Answer: A

--- PAGE_BREAK_2 ---
Downloaded from www.testbank.com
Page 2 of 2
2. Question two?
A. Opt A
B. Opt B
Answer: B
  `;

  const mcqs = parsePdfTextToMCQs(text);
  assert.equal(mcqs.length, 2);
  assert.ok(!mcqs[0].questionText.includes('Downloaded from'));
  assert.ok(!mcqs[1].questionText.includes('Downloaded from'));
});

test('Case 10: Scanned/No-text PDF buffer handling', async () => {
  // Empty buffer
  const emptyRes = await extractMcqsFromBuffer(Buffer.from(''), 'test.pdf');
  assert.equal(emptyRes.success, false);
  assert.equal(emptyRes.status, 'failed');

  // Buffer with non-extractable text
  const noTextRes = await extractMcqsFromBuffer(Buffer.from('PDF binary dummy content without text'), 'scanned.pdf');
  assert.equal(noTextRes.success, false);
  assert.equal(noTextRes.status, 'no_text');
  assert.equal(noTextRes.questions.length, 0);
});
