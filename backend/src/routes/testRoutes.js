const express = require('express');
const router = express.Router();
const {
  getTests,
  getTestById,
  createTest,
  updateTest,
  deleteTest,
} = require('../controllers/testController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getTests);
router.get('/:id', protect, getTestById);
router.post('/', protect, authorize('teacher', 'admin'), createTest);
router.put('/:id', protect, authorize('teacher', 'admin'), updateTest);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteTest);

module.exports = router;
