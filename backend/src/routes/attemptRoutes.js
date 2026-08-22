const express = require('express');
const router = express.Router();
const {
  startAttempt,
  autoSaveAnswer,
  saveBatchAnswers,
  recordViolation,
  submitAttempt,
  getAttemptResult,
  getMyHistory,
} = require('../controllers/attemptController');
const { protect, authorize } = require('../middleware/auth');

router.post('/start/:id', protect, authorize('student'), startAttempt);
router.put('/:id/save', protect, authorize('student'), autoSaveAnswer);
router.put('/:id/save-batch', protect, authorize('student'), saveBatchAnswers);
router.post('/:id/violation', protect, authorize('student'), recordViolation);
router.post('/:id/submit', protect, authorize('student'), submitAttempt);
router.get('/history/me', protect, authorize('student'), getMyHistory);
router.get('/:id/result', protect, getAttemptResult);

module.exports = router;
