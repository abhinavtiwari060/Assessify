const express = require('express');
const router = express.Router();
const { getSubjects, createSubject, updateSubject, deleteSubject } = require('../controllers/subjectController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getSubjects);
router.post('/', protect, authorize('teacher', 'admin'), createSubject);
router.put('/:id', protect, authorize('teacher', 'admin'), updateSubject);
router.delete('/:id', protect, authorize('admin'), deleteSubject);

module.exports = router;
