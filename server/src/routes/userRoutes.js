const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUserStats
} = require('../controllers/userController');

const { protect, authorize } = require('../middleware/auth');
const { validateUpdateDetails } = require('../middleware/validation');

const router = express.Router();

// All routes are protected and require admin role
router.use(protect);
router.use(authorize('admin'));

// User statistics route (should be before /:id route)
router.get('/stats', getUserStats);

// CRUD operations
router.route('/')
  .get(getUsers);

router.route('/:id')
  .get(getUser)
  .put(validateUpdateDetails, updateUser)
  .delete(deleteUser);

// Toggle user status
router.patch('/:id/toggle-status', toggleUserStatus);

module.exports = router;