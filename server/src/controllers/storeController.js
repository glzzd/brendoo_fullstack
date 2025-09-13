const mongoose = require('mongoose');
const Store = require('../models/Store');
const Product = require('../models/Product');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all stores
// @route   GET /api/stores
// @access  Private
exports.getStores = asyncHandler(async (req, res, next) => {
  const stores = await Store.find();
  
  res.status(200).json({
    success: true,
    count: stores.length,
    data: stores
  });
});



// @desc    Get store products
// @route   GET /api/stores/:id/products
// @access  Private
exports.getStoreProducts = asyncHandler(async (req, res, next) => {
  const store = await Store.findById(req.params.id);
  
  if (!store) {
    return next(new ErrorResponse(`Store not found with id of ${req.params.id}`, 404));
  }
  
  const products = await Product.find({ store: req.params.id, isActive: true })
    .populate('store', 'name website')
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    success: true,
    count: products.length,
    data: products
  });
});

// @desc    Get store inventory stats
// @route   GET /api/stores/:id/stats
// @access  Private
exports.getStoreStats = asyncHandler(async (req, res, next) => {
  const store = await Store.findById(req.params.id);
  
  if (!store) {
    return next(new ErrorResponse(`Store not found with id of ${req.params.id}`, 404));
  }
  
  const totalProducts = await Product.countDocuments({ store: req.params.id, isActive: true });
  const inStockProducts = await Product.countDocuments({ store: req.params.id, isActive: true, inStock: true });
  const outOfStockProducts = await Product.countDocuments({ store: req.params.id, isActive: true, inStock: false });
  const limitedStockProducts = await Product.countDocuments({ store: req.params.id, isActive: true, stockStatus: 'limited_stock' });
  
  const totalStockValue = await Product.aggregate([
    { $match: { store: mongoose.Types.ObjectId(req.params.id), isActive: true } },
    { $group: { _id: null, total: { $sum: '$totalStock' } } }
  ]);
  
  res.status(200).json({
    success: true,
    data: {
      store: {
        id: store._id,
        name: store.name,
        website: store.website
      },
      products: {
        total: totalProducts,
        inStock: inStockProducts,
        outOfStock: outOfStockProducts,
        limitedStock: limitedStockProducts
      },
      inventory: {
        totalStock: totalStockValue[0]?.total || 0
      }
    }
  });
});

// @desc    Get single store
// @route   GET /api/stores/:id
// @access  Private
exports.getStore = asyncHandler(async (req, res, next) => {
  const store = await Store.findById(req.params.id);

  if (!store) {
    return next(new ErrorResponse(`Store not found with id of ${req.params.id}`, 404));
  }



  res.status(200).json({
    success: true,
    data: store
  });
});

// @desc    Create new store
// @route   POST /api/stores
// @access  Private
exports.createStore = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.owner = req.user.id;

  const store = await Store.create(req.body);

  res.status(201).json({
    success: true,
    data: store
  });
});

// @desc    Update store
// @route   PUT /api/stores/:id
// @access  Private
exports.updateStore = asyncHandler(async (req, res, next) => {
  let store = await Store.findById(req.params.id);

  if (!store) {
    return next(new ErrorResponse(`Store not found with id of ${req.params.id}`, 404));
  }



  store = await Store.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: store
  });
});

// @desc    Delete store
// @route   DELETE /api/stores/:id
// @access  Private
exports.deleteStore = asyncHandler(async (req, res, next) => {
  const store = await Store.findById(req.params.id);

  if (!store) {
    return next(new ErrorResponse(`Store not found with id of ${req.params.id}`, 404));
  }



  await store.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get stores in radius
// @route   GET /api/stores/radius/:zipcode/:distance
// @access  Private
exports.getStoresInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // Get lat/lng from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  // Calc radius using radians
  // Divide dist by radius of Earth
  // Earth Radius = 3,963 mi / 6,378 km
  const radius = distance / 3963;

  const stores = await Store.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    success: true,
    count: stores.length,
    data: stores
  });
});