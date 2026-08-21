const { extractMcqsFromBuffer } = require('../services/pdfExtractor');
const { logAudit } = require('../middleware/auth');

// @desc    Extract MCQs from uploaded PDF
// @route   POST /api/pdf/extract
// @access  Private (Teacher / Admin)
const extractPdfQuestions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF file' });
    }

    const result = await extractMcqsFromBuffer(req.file.buffer);

    await logAudit(
      req,
      'PDF_MCQ_EXTRACT',
      `Extracted ${result.questions.length} questions from uploaded file "${req.file.originalname}"`
    );

    res.json({
      message: 'PDF processed successfully. Please review extracted questions before publishing.',
      fileName: req.file.originalname,
      pageCount: result.pageCount,
      totalExtracted: result.questions.length,
      questions: result.questions,
    });
  } catch (error) {
    console.error('PDF extraction controller error:', error);
    res.status(400).json({ message: error.message || 'PDF extraction failed. Please check file format.' });
  }
};

module.exports = { extractPdfQuestions };
