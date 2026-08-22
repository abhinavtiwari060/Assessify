const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_12345');

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user || !req.user.isActive) {
        return res.status(401).json({ message: 'User account is inactive or disabled' });
      }

      return next();
    } catch (error) {
      console.error('Auth verification error:', error.message);
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role (${req.user ? req.user.role : 'guest'}) is not authorized to access this resource`,
      });
    }

    if (req.user.role === 'teacher' && req.user.isApproved === false) {
      return res.status(403).json({
        message: 'Teacher account is pending admin approval',
      });
    }

    next();
  };
};

const requireApprovedTeacher = (req, res, next) => {
  if (req.user && req.user.role === 'teacher' && req.user.isApproved === false) {
    return res.status(403).json({
      message: 'Teacher account is pending admin approval',
    });
  }
  next();
};

const logAudit = (req, action, details) => {
  setImmediate(async () => {
    try {
      await AuditLog.create({
        userId: req.user ? req.user._id : null,
        userName: req.user ? req.user.name : 'System/Guest',
        userRole: req.user ? req.user.role : 'guest',
        action,
        details,
        ipAddress: req.ip || req.connection?.remoteAddress || '',
      });
    } catch (err) {
      console.error('Failed to log audit event:', err.message);
    }
  });
};

module.exports = { protect, authorize, requireApprovedTeacher, logAudit };
