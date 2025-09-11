const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// GoSport API base URL
const GOSPORT_API_BASE = 'https://192.168.10.129:7258/api/GoSport';

// Disable SSL certificate verification for external API calls
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';



// @desc    Get all brands
// @route   GET /api/GoSport/brands
// @access  Public
exports.getBrands = asyncHandler(async (req, res, next) => {
  try {
    const response = await fetch(`${GOSPORT_API_BASE}/brands`);
    
    if (!response.ok) {
      return next(new ErrorResponse(`GoSport API error: ${response.status}`, response.status));
    }
    
    const data = await response.json();
    
    res.status(200).json(data);
  } catch (error) {
    console.error('GoSport API Error:', error);
    return next(new ErrorResponse('Failed to fetch brands from GoSport API', 500));
  }
});

// @desc    Get products by brand
// @route   GET /api/GoSport/products?href=brandUrl
// @access  Public
exports.getProducts = asyncHandler(async (req, res, next) => {
  const { href } = req.query;
  
  if (!href) {
    return next(new ErrorResponse('Brand href is required', 400));
  }
  
  try {
    const response = await fetch(`${GOSPORT_API_BASE}/products?href=${encodeURIComponent(href)}`);
    
    if (!response.ok) {
      return next(new ErrorResponse(`GoSport API error: ${response.status}`, response.status));
    }
    
    const data = await response.json();
    
    res.status(200).json(data);
  } catch (error) {
    console.error('GoSport API Error:', error);
    return next(new ErrorResponse('Failed to fetch products from GoSport API', 500));
  }
});

// @desc    Get all categories
// @route   GET /api/GoSport/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res, next) => {
  try {
    const response = await fetch(`${GOSPORT_API_BASE}/categories`);
    
    if (!response.ok) {
      return next(new ErrorResponse(`GoSport API error: ${response.status}`, response.status));
    }
    
    const data = await response.json();
    
    res.status(200).json(data);
  } catch (error) {
    console.error('GoSport API Error:', error);
    return next(new ErrorResponse('Failed to fetch categories from GoSport API', 500));
  }
});