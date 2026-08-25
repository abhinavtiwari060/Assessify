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

    const result = await extractMcqsFromBuffer(req.file.buffer, req.file.originalname);

    await logAudit(
      req,
      'PDF_MCQ_EXTRACT',
      `Processed uploaded file "${req.file.originalname}": ${result.totalExtracted} question(s) extracted (Status: ${result.status})`
    );

    res.json({
      success: result.success,
      status: result.status,
      message: result.message || 'PDF processed successfully. Please review extracted questions before publishing.',
      fileName: req.file.originalname,
      pageCount: result.pageCount,
      textLength: result.textLength || 0,
      totalExtracted: result.questions.length,
      questions: result.questions,
      warnings: result.warnings || [],
    });
  } catch (error) {
    console.error('PDF extraction controller error:', error);
    res.status(400).json({
      success: false,
      status: 'failed',
      message: error.message || 'PDF extraction failed. Please check file format.',
      questions: [],
      warnings: [error.message || 'Fatal extraction error.'],
    });
  }
};

module.exports = { extractPdfQuestions };
