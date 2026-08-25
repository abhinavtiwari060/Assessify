const crypto = require('crypto');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Test = require('../models/Test');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const { logAudit } = require('../middleware/auth');

/**
 * Generates a cryptographically secure 10-character temporary password
 * containing uppercase, lowercase, numbers, and special symbols (e.g. K7#mP92@xL).
 */
const generateSecureTempPassword = () => {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const nums = '23456789';
  const syms = '@#$%&*!';
  const all = upper + lower + nums + syms;

  const chars = [
    upper[crypto.randomInt(0, upper.length)],
    lower[crypto.randomInt(0, lower.length)],
    nums[crypto.randomInt(0, nums.length)],
    syms[crypto.randomInt(0, syms.length)],
  ];

  for (let i = 4; i < 10; i++) {
    chars.push(all[crypto.randomInt(0, all.length)]);
  }

  // Cryptographically shuffle array
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
};

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

// @desc    Get password reset requests
// @route   GET /api/admin/password-resets
// @access  Private (Admin)
const getPasswordResetRequests = async (req, res) => {
  try {
    const requests = await PasswordResetRequest.find()
      .sort({ requestedAt: -1 })
      .lean();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Process password reset request (Admin generates temporary password)
// @route   POST /api/admin/password-resets/:id/reset
// @access  Private (Admin)
const processPasswordReset = async (req, res) => {
  try {
    const resetReq = await PasswordResetRequest.findById(req.params.id);
    if (!resetReq) {
      return res.status(404).json({ message: 'Password reset request not found' });
    }

    if (resetReq.status !== 'PENDING') {
      return res.status(400).json({ message: `Request is already ${resetReq.status.toLowerCase()}` });
    }

    const user = await User.findById(resetReq.userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'Associated user account not found' });
    }

    // Generate secure temporary password
    const tempPassword = generateSecureTempPassword();

    // Hash and store temporary password in user document
    user.password = tempPassword;
    user.mustChangePassword = true;
    user.temporaryPasswordExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours expiry
    await user.save();

    // Mark reset request as completed
    resetReq.status = 'COMPLETED';
    resetReq.processedAt = new Date();
    resetReq.processedBy = req.user._id;
    resetReq.processedByName = req.user.name;
    await resetReq.save();

    await logAudit(
      req,
      'ADMIN_PASSWORD_RESET',
      `Admin ${req.user.email} reset password for ${user.email} (${user.role})`
    );

    // Return temporary password ONCE to admin for manual communication
    res.json({
      message: 'Password reset successful. Please communicate the temporary password to the user.',
      temporaryPassword: tempPassword,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Process password reset error:', error);
    res.status(500).json({ message: error.message });
  }
};

const PlatformSettings = require('../models/PlatformSettings');

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

// @desc    Reset platform leaderboard cutoff (Admin only)
// @route   POST /api/admin/leaderboard/reset
// @access  Private (Admin)
const resetLeaderboard = async (req, res) => {
  try {
    const resetAt = new Date();
    const settings = await PlatformSettings.findOneAndUpdate(
      {},
      { leaderboardResetAt: resetAt },
      { upsert: true, new: true }
    );

    await logAudit(
      req,
      'LEADERBOARD_RESET',
      `Admin ${req.user.email} reset platform leaderboard rankings (Cutoff: ${resetAt.toISOString()})`
    );

    res.json({
      success: true,
      message: 'Leaderboard reset successfully',
      resetAt: settings.leaderboardResetAt,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
  getPasswordResetRequests,
  processPasswordReset,
  getAuditLogs,
  resetLeaderboard,
};
