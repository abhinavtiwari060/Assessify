const { extractMcqsFromBuffer } = require('../services/pdfExtractor');
const { logAudit } = require('../middleware/auth');

// @desc    Extract MCQs from uploaded PDF
// @route   POST /api/pdf/extract
// @access  Private (Teacher / Admin)
const extractPdfQuestions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF file' });
    }

    const result = await extractMcqsFromBuffer(req.file.buffer);

    if (!result.success) {
      return res.status(200).json({
        success: false,
        requiresOCR: Boolean(result.requiresOCR),
        fileName: req.file.originalname,
        textLength: result.textLength || 0,
        pageCount: result.pageCount || 1,
        questionCount: 0,
        questions: [],
        error: result.error || 'No valid MCQs could be detected from the extracted PDF text.',
      });
    }

    await logAudit(
      req,
      'PDF_MCQ_EXTRACT',
      `Extracted ${result.questionCount} questions from uploaded file "${req.file.originalname}"`
    );

    res.json({
      success: true,
      message: 'PDF processed successfully. Please review extracted questions before publishing.',
      fileName: req.file.originalname,
      textLength: result.textLength,
      pageCount: result.pageCount,
      questionCount: result.questionCount,
      statistics: result.statistics,
      questions: result.questions,
    });
  } catch (error) {
    console.error('PDF extraction controller error:', error);
    res.status(500).json({
      success: false,
      questions: [],
      error: error.message || 'PDF extraction failed. Please check file format.',
    });
  }
};

module.exports = { extractPdfQuestions };
