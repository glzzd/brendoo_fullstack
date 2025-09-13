const express = require('express');
const { getCategories, createCategory, syncCategories, getCategoryStats, getCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');

const { protect } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// Apply auth middleware to all routes
router.use(protect);

// Store-specific category routes
router
  .route('/stores/:storeId/categories')
  .get(getCategories)
  .post(createCategory);

// Category sync route
router
  .route('/sync/:storeId')
  .post(syncCategories);

// Category stats route
router
  .route('/stores/:storeId/categories/stats')
  .get(getCategoryStats);



// Individual category routes
router
  .route('/:id')
  .get(getCategory)
  .put(updateCategory)
  .delete(deleteCategory);

module.exports = router;