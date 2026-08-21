const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logAudit } = require('../middleware/auth');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret_key_12345', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, bio, rollNo } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please enter all required fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    if (rollNo && rollNo.trim()) {
      const existingRoll = await User.findOne({ rollNo: rollNo.trim() });
      if (existingRoll) {
        return res.status(400).json({ message: `Roll number '${rollNo.trim()}' is already registered to another user` });
      }
    }

    // Default to student if invalid role provided
    const userRole = ['student', 'teacher', 'admin'].includes(role) ? role : 'student';

    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      rollNo: rollNo ? rollNo.trim() : undefined,
      bio: bio || '',
    });

    if (user) {
      await logAudit(req, 'USER_REGISTER', `User registered with role ${user.role} (${user.email})`);

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNo: user.rollNo || '',
        bio: user.bio,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.rollNo) {
      return res.status(400).json({ message: `Roll number is already taken by another student` });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Google OAuth / Firebase Login
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  try {
    const { email, name, avatar, firebaseUid, rollNo, role } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Google account email is required' });
    }

    let user = await User.findOne({ email });

    if (user) {
      if (!user.isActive) {
        return res.status(403).json({ message: 'Your account has been deactivated. Please contact support.' });
      }

      if (rollNo && rollNo.trim() && (!user.rollNo || user.rollNo !== rollNo.trim())) {
        const existingRoll = await User.findOne({ rollNo: rollNo.trim(), _id: { $ne: user._id } });
        if (existingRoll) {
          return res.status(400).json({ message: `Roll number '${rollNo}' is already taken by another student` });
        }
        user.rollNo = rollNo.trim();
        await user.save();
      }
    } else {
      if (rollNo && rollNo.trim()) {
        const existingRoll = await User.findOne({ rollNo: rollNo.trim() });
        if (existingRoll) {
          return res.status(400).json({ message: `Roll number '${rollNo}' is already registered to another user` });
        }
      }

      const userRole = ['student', 'teacher', 'admin'].includes(role) ? role : 'student';

      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: Math.random().toString(36).slice(-10) + 'A1!',
        role: userRole,
        rollNo: rollNo ? rollNo.trim() : undefined,
        authProvider: 'google',
        firebaseUid: firebaseUid || '',
        avatar: avatar || '',
      });
      await logAudit(req, 'GOOGLE_REGISTER', `User signed up via Google Auth (${email})`);
    }

    req.user = user;
    await logAudit(req, 'USER_LOGIN', `User logged in via Google Auth as ${user.role}`);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      rollNo: user.rollNo || '',
      avatar: user.avatar,
      bio: user.bio,
      token: generateToken(user._id),
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.rollNo) {
      return res.status(400).json({ message: `Roll number is already taken by another student` });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      if (!user.isActive) {
        return res.status(403).json({ message: 'Your account has been deactivated. Please contact support.' });
      }

      req.user = user;
      await logAudit(req, 'USER_LOGIN', `User logged in as ${user.role}`);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNo: user.rollNo || '',
        avatar: user.avatar,
        bio: user.bio,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      if (req.body.rollNo !== undefined) {
        const newRollNo = req.body.rollNo.trim();
        if (newRollNo && newRollNo !== user.rollNo) {
          const existingRoll = await User.findOne({ rollNo: newRollNo, _id: { $ne: user._id } });
          if (existingRoll) {
            return res.status(400).json({ message: `Roll number '${newRollNo}' is already assigned to another user` });
          }
          user.rollNo = newRollNo;
        }
      }

      user.name = req.body.name || user.name;
      user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;
      user.avatar = req.body.avatar || user.avatar;

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();
      await logAudit(req, 'PROFILE_UPDATE', `User updated profile info`);

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        rollNo: updatedUser.rollNo || '',
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.rollNo) {
      return res.status(400).json({ message: `Roll number is already assigned to another user` });
    }
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, googleAuth, loginUser, getMe, updateProfile };
