const express = require('express');
const router = express.Router();
const {
  startEssay,
  autoSaveEssay,
  submitEssay,
  getTeacherSubmissions,
  evaluateEssay,
  getMyEssaySubmissions,
} = require('../controllers/essayController');
const { protect, authorize } = require('../middleware/auth');

router.post('/start/:testId', protect, authorize('student'), startEssay);
router.put('/submissions/:id/save', protect, authorize('student'), autoSaveEssay);
router.post('/submissions/:id/submit', protect, authorize('student'), submitEssay);
router.get('/my-submissions', protect, authorize('student'), getMyEssaySubmissions);
router.get('/teacher/submissions', protect, authorize('teacher', 'admin'), getTeacherSubmissions);
router.post('/submissions/:id/evaluate', protect, authorize('teacher', 'admin'), evaluateEssay);

module.exports = router;
