const express = require('express');
const {
  getBrands,
  getProducts,
  getCategories
} = require('../controllers/gosportController');

const router = express.Router();

// GoSport API routes - no authentication required for external API proxy
router.get('/brands', getBrands);
router.get('/products', getProducts);
router.get('/categories', getCategories);

module.exports = router;