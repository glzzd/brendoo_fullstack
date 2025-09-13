const mongoose = require('mongoose');
const Product = require('../models/Product');
const Store = require('../models/Store');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
exports.getProducts = asyncHandler(async (req, res, next) => {
  const { store, category, brand, inStock, page = 1, limit = 20 } = req.query;
  
  // Build query
  let query = { isActive: true };
  
  if (store) query.store = store;
  if (category) query.category = new RegExp(category, 'i');
  if (brand) query.brand = new RegExp(brand, 'i');
  if (inStock !== undefined) query.inStock = inStock === 'true';
  
  // Pagination
  const skip = (page - 1) * limit;
  
  const products = await Product.find(query)
    .populate('store', 'name website logo')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await Product.countDocuments(query);
  
  res.status(200).json({
    success: true,
    count: products.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: products
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
exports.getProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('store', 'name website logo description');

  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Create new product
// @route   POST /api/products
// @access  Private
exports.createProduct = asyncHandler(async (req, res, next) => {
  // Check if store exists
  const store = await Store.findById(req.body.store);
  if (!store) {
    return next(new ErrorResponse(`Store not found with id of ${req.body.store}`, 404));
  }
  
  const product = await Product.create(req.body);
  
  await product.populate('store', 'name website logo');

  res.status(201).json({
    success: true,
    data: product
  });
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
exports.updateProduct = asyncHandler(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('store', 'name website logo');

  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private
exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }

  // Soft delete - set isActive to false
  await Product.findByIdAndUpdate(req.params.id, { isActive: false });

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Bulk create/update products
// @route   POST /api/products/bulk
// @access  Private
exports.bulkCreateProducts = asyncHandler(async (req, res, next) => {
  const { products } = req.body;
  
  if (!products || !Array.isArray(products)) {
    return next(new ErrorResponse('Please provide products array', 400));
  }
  
  const results = {
    created: [],
    updated: [],
    errors: []
  };
  
  for (const productData of products) {
    try {
      // Check if product exists by SKU or URL
      let existingProduct = null;
      
      if (productData.sku) {
        existingProduct = await Product.findOne({ sku: productData.sku });
      } else if (productData.url) {
        existingProduct = await Product.findOne({ url: productData.url });
      }
      
      if (existingProduct) {
        // Update existing product
        const updatedProduct = await Product.findByIdAndUpdate(
          existingProduct._id,
          { ...productData, scrapedAt: new Date() },
          { new: true, runValidators: true }
        ).populate('store', 'name website');
        
        results.updated.push(updatedProduct);
      } else {
        // Create new product
        const newProduct = await Product.create({
          ...productData,
          scrapedAt: new Date()
        });
        
        await newProduct.populate('store', 'name website');
        results.created.push(newProduct);
      }
    } catch (error) {
      results.errors.push({
        product: productData.name || productData.sku || productData.url,
        error: error.message
      });
    }
  }
  
  res.status(200).json({
    success: true,
    message: 'Bulk product operation completed',
    data: results
  });
});

// @desc    Update product stock
// @route   PUT /api/products/:id/stock
// @access  Private
exports.updateProductStock = asyncHandler(async (req, res, next) => {
  const { sizes } = req.body;
  
  if (!sizes || !Array.isArray(sizes)) {
    return next(new ErrorResponse('Please provide sizes array with stock information', 400));
  }
  
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
  }
  
  // Update sizes with new stock information
  product.sizes = sizes;
  await product.save(); // This will trigger the pre-save hook to calculate total stock
  
  await product.populate('store', 'name website');
  
  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Get products by category
// @route   GET /api/products/category/:category
// @access  Private
exports.getProductsByCategory = asyncHandler(async (req, res, next) => {
  const { category } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  const skip = (page - 1) * limit;
  
  const products = await Product.find({
    category: new RegExp(category, 'i'),
    isActive: true
  })
    .populate('store', 'name website logo')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await Product.countDocuments({
    category: new RegExp(category, 'i'),
    isActive: true
  });
  
  res.status(200).json({
    success: true,
    count: products.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: products
  });
});

// @desc    Search products
// @route   GET /api/products/search
// @access  Private
exports.searchProducts = asyncHandler(async (req, res, next) => {
  const { q, page = 1, limit = 20 } = req.query;
  
  if (!q) {
    return next(new ErrorResponse('Please provide search query', 400));
  }
  
  const skip = (page - 1) * limit;
  
  const searchRegex = new RegExp(q, 'i');
  
  const products = await Product.find({
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { brand: searchRegex },
      { category: searchRegex }
    ],
    isActive: true
  })
    .populate('store', 'name website logo')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const total = await Product.countDocuments({
    $or: [
      { name: searchRegex },
      { description: searchRegex },
      { brand: searchRegex },
      { category: searchRegex }
    ],
    isActive: true
  });
  
  res.status(200).json({
    success: true,
    count: products.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: products
  });
});