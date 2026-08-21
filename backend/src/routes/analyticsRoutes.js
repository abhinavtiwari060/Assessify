const express = require('express');
const router = express.Router();
const {
  getLeaderboard,
  getStudentReportCard,
  getTeacherAnalytics,
  getAdminAnalytics,
} = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/leaderboard', protect, getLeaderboard);
router.get('/report-card/me', protect, authorize('student'), getStudentReportCard);
router.get('/teacher', protect, authorize('teacher', 'admin'), getTeacherAnalytics);
router.get('/admin', protect, authorize('admin'), getAdminAnalytics);

module.exports = router;
