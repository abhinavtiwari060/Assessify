const express = require('express');
const router = express.Router();
const {
  getUsers,
  getTeachers,
  getPendingTeachers,
  approveTeacher,
  deleteUser,
  updateUserRole,
  toggleUserStatus,
  getPasswordResetRequests,
  processPasswordReset,
  getAuditLogs,
  resetLeaderboard,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', toggleUserStatus);

router.get('/teachers', getTeachers);
router.get('/teachers/pending', getPendingTeachers);
router.patch('/teachers/:id/approve', approveTeacher);
router.put('/teachers/:id/approve', approveTeacher);

router.get('/password-resets', getPasswordResetRequests);
router.post('/password-resets/:id/reset', processPasswordReset);

router.post('/leaderboard/reset', resetLeaderboard);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
