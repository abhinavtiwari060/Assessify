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

    const users = await User.find(query).select('-password').sort({ createdAt: -1 }).lean();
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

// @desc    Get all teachers (both pending & approved)
// @route   GET /api/admin/teachers
// @access  Private (Admin)
const getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pending teachers waiting for approval
// @route   GET /api/admin/teachers/pending
// @access  Private (Admin)
const getPendingTeachers = async (req, res) => {
  try {
    const pendingTeachers = await User.find({ role: 'teacher', isApproved: false })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();
    res.json(pendingTeachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve teacher account
// @route   PATCH /api/admin/teachers/:id/approve
// @access  Private (Admin)
const approveTeacher = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    if (user.role !== 'teacher') {
      return res.status(400).json({ message: 'User is not a teacher' });
    }

    user.isApproved = true;
    await user.save();

    await logAudit(
      req,
      'ADMIN_TEACHER_APPROVE',
      `Approved teacher account for ${user.email}`
    );

    res.json({
      message: 'Teacher approved successfully.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete user account (Student/Teacher/Admin)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'Admin cannot delete their own account.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const roleName = user.role;
    const userEmail = user.email;

    await User.findByIdAndDelete(req.params.id);

    await logAudit(
      req,
      'ADMIN_USER_DELETE',
      `Deleted ${roleName} account ${userEmail}`
    );

    const message =
      roleName === 'teacher'
        ? 'Teacher deleted successfully.'
        : roleName === 'student'
        ? 'Student deleted successfully.'
        : 'User deleted successfully.';

    res.json({ message });
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

    const logs = await AuditLog.find(query).sort({ createdAt: -1 }).limit(Number(limit)).lean();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUsers,
  getTeachers,
  getPendingTeachers,
  approveTeacher,
  deleteUser,
  updateUserRole,
  toggleUserStatus,
  getAuditLogs,
};
