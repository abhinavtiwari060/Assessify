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

    const result = await extractMcqsFromBuffer(req.file.buffer, req.file.originalname);

    if (!result.success) {
      return res.status(200).json({
        success: false,
        status: result.status || 'failed',
        requiresOCR: Boolean(result.requiresOCR),
        fileName: req.file.originalname,
        textLength: result.textLength || 0,
        pageCount: result.pageCount || 1,
        questionCount: 0,
        totalExtracted: 0,
        questions: [],
        warnings: result.warnings || [],
        error: result.error || 'No valid MCQs could be detected from the extracted PDF text.',
      });
    }

    await logAudit(
      req,
      'PDF_MCQ_EXTRACT',
      `Processed uploaded file "${req.file.originalname}": ${result.questions.length} question(s) extracted`
    );

    res.json({
      success: true,
      status: result.status || 'success',
      message: result.message || 'PDF processed successfully. Please review extracted questions before publishing.',
      fileName: req.file.originalname,
      textLength: result.textLength || 0,
      pageCount: result.pageCount || 1,
      questionCount: result.questionCount || result.questions.length,
      totalExtracted: result.questions.length,
      statistics: result.statistics || null,
      questions: result.questions,
      warnings: result.warnings || [],
    });
  } catch (error) {
    console.error('PDF extraction controller error:', error);
    res.status(500).json({
      success: false,
      status: 'failed',
      message: error.message || 'PDF extraction failed. Please check file format.',
      questions: [],
      warnings: [error.message || 'Fatal extraction error.'],
      error: error.message || 'PDF extraction failed. Please check file format.',
    });
  }
};

module.exports = { extractPdfQuestions };
