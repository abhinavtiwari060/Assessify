const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Test = require('../models/Test');
const { logAudit } = require('../middleware/auth');

// @desc    Get list of all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'teacher', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await logAudit(
      req,
      'ADMIN_ROLE_CHANGE',
      `Changed user ${user.email} role from ${oldRole} to ${role}`
    );

    res.json({ message: `Role updated to ${role}`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle user active/deactive status
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    await logAudit(
      req,
      'ADMIN_USER_STATUS',
      `User ${user.email} status toggled to active=${user.isActive}`
    );

    res.json({ message: `User status changed to ${user.isActive ? 'Active' : 'Disabled'}`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get system audit logs
// @route   GET /api/admin/audit-logs
// @access  Private (Admin)
const getAuditLogs = async (req, res) => {
  try {
    const { limit = 50, action } = req.query;
    let query = {};
    if (action) query.action = action;

    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(Number(limit));
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  updateUserRole,
  toggleUserStatus,
  getAuditLogs,
};
