const express = require('express');
const {
  register,
  login,
  getMe,
  updateDetails,
  updatePassword,
  logout
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
const {
  validateRegister,
  validateLogin,
  validateUpdateDetails,
  validateUpdatePassword
} = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, validateUpdateDetails, updateDetails);
router.put('/updatepassword', protect, validateUpdatePassword, updatePassword);
router.get('/logout', protect, logout);

module.exports = router;