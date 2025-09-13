const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const brandScraper = require('../scrapers/gosport-scraper/brandScraper');
const goSportScraper = require('../scrapers/gosport-scraper');







// @desc    Get scraped brands from GoSport.az
// @route   GET /api/GoSport/scraped-brands
// @access  Public
exports.getScrapedBrands = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 50 } = req.query;
  
  try {
    // Always clear cache to get fresh data
    brandScraper.clearCache();
    const brands = await brandScraper.scrapeBrands(parseInt(page), parseInt(limit));
    
    res.status(200).json({
      success: true,
      data: brands
    });
  } catch (error) {
    console.error('Brand scraper error:', error);
    return next(new ErrorResponse('Failed to scrape brands from GoSport.az', 500));
  }
});

// @desc    Get all scraped brands (all pages)
// @route   GET /api/GoSport/scraped-brands/all
// @access  Public
exports.getAllScrapedBrands = asyncHandler(async (req, res, next) => {
  try {
    // Always clear cache to get fresh data
    brandScraper.clearCache();
    const allBrands = await brandScraper.scrapeAllBrands();
    
    res.status(200).json({
      success: true,
      data: allBrands,
      count: allBrands.length
    });
  } catch (error) {
    console.error('Brand scraper error:', error);
    return next(new ErrorResponse('Failed to scrape all brands from GoSport.az', 500));
  }
});

// @desc    Get brands using new GoSport scraper
// @route   GET /api/GoSport/scraper-brands
// @access  Public
exports.getScraperBrands = asyncHandler(async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    console.log(`🔍 Getting brands from GoSport scraper (page: ${page}, limit: ${limit})...`);
    
    const brands = await goSportScraper.getBrands(parseInt(page), parseInt(limit));
    
    res.status(200).json({
      success: true,
      count: brands.length,
      page: parseInt(page),
      limit: parseInt(limit),
      data: brands
    });
    
  } catch (error) {
    console.error('❌ Error in getScraperBrands:', error.message);
    return next(new ErrorResponse('Failed to get brands from scraper', 500));
  }
});

// @desc    Get all brands using new GoSport scraper
// @route   GET /api/GoSport/scraper-all-brands
// @access  Public
exports.getScraperAllBrands = asyncHandler(async (req, res, next) => {
  try {
    console.log('🔍 Getting all brands from GoSport scraper...');
    
    // Always clear cache to get fresh data
    goSportScraper.brandScraper.clearCache();
    
    const brands = await goSportScraper.getAllBrands();
    
    res.status(200).json({
      success: true,
      count: brands.length,
      data: brands
    });
    
  } catch (error) {
    console.error('❌ Error in getScraperAllBrands:', error.message);
    return next(new ErrorResponse('Failed to get all brands from scraper', 500));
  }
});

// @desc    Get products by brand using new GoSport scraper
// @route   GET /api/GoSport/scraper-products/:brandUrl
// @access  Public
exports.getScraperProductsByBrand = asyncHandler(async (req, res, next) => {
  try {
    const { brandUrl } = req.params;
    const { brandName } = req.query;
    
    if (!brandUrl) {
      return next(new ErrorResponse('Brand URL is required', 400));
    }
    
    console.log(`🔍 Getting products for brand: ${brandName || 'Unknown'} from URL: ${brandUrl}`);
    
    const products = await goSportScraper.getProductsByBrand(decodeURIComponent(brandUrl), brandName || 'Unknown');
    
    res.status(200).json({
      success: true,
      count: products.length,
      brandUrl: decodeURIComponent(brandUrl),
      brandName: brandName || 'Unknown',
      data: products
    });
    
  } catch (error) {
    console.error('❌ Error in getScraperProductsByBrand:', error.message);
    return next(new ErrorResponse('Failed to get products from scraper', 500));
  }
});