const express = require('express');
const router = express.Router();
const multer = require('multer');
const { extractPdfQuestions, extractPdfReadingComprehension } = require('../controllers/pdfController');
const { protect, authorize } = require('../middleware/auth');

// Configure multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

router.post(
  '/extract',
  protect,
  authorize('teacher', 'admin'),
  upload.single('pdf'),
  extractPdfQuestions
);

router.post(
  '/extract-rc',
  protect,
  authorize('teacher', 'admin'),
  upload.single('pdf'),
  extractPdfReadingComprehension
);

module.exports = router;
