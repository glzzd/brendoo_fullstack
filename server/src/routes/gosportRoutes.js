const express = require('express');
const {
  getScrapedBrands,
  getAllScrapedBrands,
  getScraperBrands,
  getScraperAllBrands,
  getScraperProductsByBrand
} = require('../controllers/gosportController');

const router = express.Router();

// GoSport scraper routes - PUBLIC ACCESS (no auth required)
router.get('/scraped-brands', getScrapedBrands);
router.get('/all-scraped-brands', getAllScrapedBrands);

// New scraper endpoints - PUBLIC ACCESS (no auth required)
router.get('/scraper-brands', getScraperBrands);
router.get('/scraper-all-brands', getScraperAllBrands);
router.get('/scraper-products/:brandUrl', getScraperProductsByBrand);

module.exports = router;