const express = require('express');
const router = express.Router();
const {
  getUsers,
  updateUserRole,
  toggleUserStatus,
  getAuditLogs,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', toggleUserStatus);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
