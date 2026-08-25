const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  adminLogin,
  forgotPassword,
  changePassword,
  getMe,
  updateProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/admin/login', adminLogin);
router.post('/forgot-password', forgotPassword);
router.post('/change-password', protect, changePassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
