const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkCreateProducts,
  updateProductStock,
  getProductsByCategory,
  searchProducts
} = require('../controllers/productController');

const router = express.Router();

// Protect all routes
const { protect } = require('../middleware/auth');

// Apply protect middleware to all routes
router.use(protect);

// Routes
router
  .route('/')
  .get(getProducts)
  .post(createProduct);

// Bulk operations
router
  .route('/bulk')
  .post(bulkCreateProducts);

// Search products
router
  .route('/search')
  .get(searchProducts);

// Products by category
router
  .route('/category/:category')
  .get(getProductsByCategory);

// Single product routes
router
  .route('/:id')
  .get(getProduct)
  .put(updateProduct)
  .delete(deleteProduct);

// Update product stock
router
  .route('/:id/stock')
  .put(updateProductStock);

module.exports = router;