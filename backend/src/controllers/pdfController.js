const { extractMcqsFromBuffer, extractReadingComprehensionFromBuffer } = require('../services/pdfExtractor');
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

// @desc    Extract Reading Comprehension from uploaded PDF
// @route   POST /api/pdf/extract-rc
// @access  Private (Teacher / Admin)
const extractPdfReadingComprehension = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF file' });
    }

    const result = await extractReadingComprehensionFromBuffer(req.file.buffer, req.file.originalname);

    if (!result.success) {
      return res.status(200).json({
        success: false,
        status: result.status || 'failed',
        fileName: req.file.originalname,
        passages: [],
        questions: [],
        warnings: result.warnings || ['This PDF does not appear to contain a valid Reading Comprehension passage and question structure.'],
        error: result.message || 'This PDF does not appear to contain a valid Reading Comprehension passage and question structure.',
      });
    }

    await logAudit(
      req,
      'PDF_RC_EXTRACT',
      `Processed uploaded file "${req.file.originalname}": ${result.passages?.length || 0} passage(s) extracted`
    );

    res.json({
      success: true,
      status: result.status || 'success',
      message: result.message || 'PDF processed successfully. Please review extracted passage and questions before saving.',
      fileName: req.file.originalname,
      textLength: result.textLength || 0,
      pageCount: result.pageCount || 1,
      passageCount: result.passageCount || 0,
      questionCount: result.questionCount || 0,
      passages: result.passages || [],
      questions: result.questions || [],
      warnings: result.warnings || [],
    });
  } catch (error) {
    console.error('PDF RC extraction controller error:', error);
    res.status(500).json({
      success: false,
      status: 'failed',
      message: error.message || 'Reading Comprehension PDF extraction failed.',
      passages: [],
      questions: [],
      warnings: [error.message || 'Fatal extraction error.'],
      error: error.message || 'Reading Comprehension PDF extraction failed.',
    });
  }
};

module.exports = {
  extractPdfQuestions,
  extractPdfReadingComprehension,
};
