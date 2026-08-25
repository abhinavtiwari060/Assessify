const express = require('express');
const router = express.Router();
const {
  startEssay,
  autoSaveEssay,
  submitEssay,
  recordEssayViolation,
  getTeacherSubmissions,
  evaluateEssay,
  getMyEssaySubmissions,
  exportEssayDocx,
  deleteEssaySubmission,
} = require('../controllers/essayController');
const { protect, authorize } = require('../middleware/auth');

router.post('/start/:testId', protect, authorize('student'), startEssay);
router.put('/submissions/:id/save', protect, authorize('student'), autoSaveEssay);
router.post('/submissions/:id/submit', protect, authorize('student'), submitEssay);
router.post('/submissions/:id/violation', protect, authorize('student'), recordEssayViolation);
router.get('/my-submissions', protect, authorize('student'), getMyEssaySubmissions);
router.get('/teacher/submissions', protect, authorize('teacher', 'admin'), getTeacherSubmissions);
router.post('/submissions/:id/evaluate', protect, authorize('teacher', 'admin'), evaluateEssay);
router.get('/submissions/:id/export', protect, authorize('teacher', 'admin'), exportEssayDocx);
router.delete('/submissions/:id', protect, authorize('teacher', 'admin'), deleteEssaySubmission);

module.exports = router;
