const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Category = require('../models/Category');
const Store = require('../models/Store');
const CacheService = require('../services/cacheService');

// @desc    Get all categories for a store
// @route   GET /api/stores/:storeId/categories
// @access  Private
exports.getCategories = asyncHandler(async (req, res, next) => {
  const { storeId } = req.params;
  const { tree = false, level } = req.query;
  
  // Verify store exists and user has access
  const store = await Store.findById(storeId);
  if (!store) {
    return next(new ErrorResponse('Mağaza bulunamadı', 404));
  }
  
  let categories;
  
  if (tree === 'true') {
    // Return hierarchical tree structure
    categories = await Category.getCategoryTree(storeId);
  } else {
    // Return flat list with optional level filter
    const filter = { store: storeId, isActive: true };
    if (level !== undefined) {
      filter.level = parseInt(level);
    }
    
    categories = await Category.find(filter)
      .populate('parent', 'name level')
      .populate('children', 'name level')
      .sort({ level: 1, sortOrder: 1, name: 1 });
  }
  
  res.status(200).json({
    success: true,
    count: Array.isArray(categories) ? categories.length : 0,
    data: categories
  });
});

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Private
exports.getCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id)
    .populate('store', 'name website')
    .populate('parent', 'name level')
    .populate('children', 'name level productCount')
    .populate('products', 'name price stock');
  
  if (!category) {
    return next(new ErrorResponse('Kategori bulunamadı', 404));
  }
  
  res.status(200).json({
    success: true,
    data: category
  });
});

// @desc    Create new category
// @route   POST /api/stores/:storeId/categories
// @access  Private
exports.createCategory = asyncHandler(async (req, res, next) => {
  const { storeId } = req.params;
  
  // Verify store exists
  const store = await Store.findById(storeId);
  if (!store) {
    return next(new ErrorResponse('Mağaza bulunamadı', 404));
  }
  
  // Add store to req.body
  req.body.store = storeId;
  
  // If parent is specified, verify it exists and calculate level
  if (req.body.parent) {
    const parentCategory = await Category.findById(req.body.parent);
    if (!parentCategory) {
      return next(new ErrorResponse('Üst kategori bulunamadı', 404));
    }
    
    if (parentCategory.store.toString() !== storeId) {
      return next(new ErrorResponse('Üst kategori farklı bir mağazaya ait', 400));
    }
    
    if (parentCategory.level >= 2) {
      return next(new ErrorResponse('Maksimum 3 seviye kategori desteklenir', 400));
    }
    
    req.body.level = parentCategory.level + 1;
  } else {
    req.body.level = 0;
  }
  
  const category = await Category.create(req.body);
  
  res.status(201).json({
    success: true,
    data: category
  });
});

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private
exports.updateCategory = asyncHandler(async (req, res, next) => {
  let category = await Category.findById(req.params.id);
  
  if (!category) {
    return next(new ErrorResponse('Kategori bulunamadı', 404));
  }
  
  // If parent is being changed, validate it
  if (req.body.parent && req.body.parent !== category.parent?.toString()) {
    const parentCategory = await Category.findById(req.body.parent);
    if (!parentCategory) {
      return next(new ErrorResponse('Üst kategori bulunamadı', 404));
    }
    
    if (parentCategory.store.toString() !== category.store.toString()) {
      return next(new ErrorResponse('Üst kategori farklı bir mağazaya ait', 400));
    }
    
    if (parentCategory.level >= 2) {
      return next(new ErrorResponse('Maksimum 3 seviye kategori desteklenir', 400));
    }
    
    // Prevent circular reference
    if (parentCategory._id.toString() === category._id.toString()) {
      return next(new ErrorResponse('Kategori kendisinin alt kategorisi olamaz', 400));
    }
    
    req.body.level = parentCategory.level + 1;
  }
  
  category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('parent', 'name level').populate('children', 'name level');
  
  res.status(200).json({
    success: true,
    data: category
  });
});

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private
exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    return next(new ErrorResponse('Kategori bulunamadı', 404));
  }
  
  // Check if category has children
  const childrenCount = await Category.countDocuments({ parent: category._id });
  if (childrenCount > 0) {
    return next(new ErrorResponse('Alt kategorileri olan kategori silinemez', 400));
  }
  
  // Check if category has products
  const Product = require('../models/Product');
  const productCount = await Product.countDocuments({ category: category._id });
  if (productCount > 0) {
    return next(new ErrorResponse('Ürünleri olan kategori silinemez', 400));
  }
  
  await category.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Sync categories from scraped data
// @route   POST /api/categories/sync/:storeId
// @access  Private
exports.syncCategories = asyncHandler(async (req, res, next) => {
  const { storeId } = req.params;
  
  // Verify store exists
  const store = await Store.findById(storeId);
  if (!store) {
    return next(new ErrorResponse('Mağaza bulunamadı', 404));
  }
  
  try {
    const cacheService = new CacheService();
    const storeName = 'gosport';
    
    // Önce cache'den veri okumaya çalış
    console.log('📖 Cache\'den kategoriler okunuyor...');
    let cachedData = cacheService.getStoreCategories(storeName);
    let scrapedBrands = [];
    
    if (cachedData && cachedData.categories) {
       console.log(`✅ Cache\'den ${cachedData.categories.length} kategori bulundu`);
       // Cache'deki veriyi scraper formatına çevir
       scrapedBrands = cachedData.categories.map(cat => ({
         name: cat.name,
         url: cat.url,
         id: cat.url.split('-').pop(), // URL'den ID çıkar
         slug: cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
         scrapedAt: new Date(cat.scrapedAt)
       }));
    } else {
      console.log('⚠️ Cache\'de veri bulunamadı, scraper çalıştırılıyor...');
      // Import scraper service (already instantiated)
      const brandScraperService = require('../services/brandScraperService');
      
      // Get all brands from scraper
      console.log('🔍 Fetching brands from scraper...');
      scrapedBrands = await brandScraperService.scrapeAllBrands();
    }
    
    console.log('📊 Kullanılacak kategori detayları:');
    scrapedBrands.forEach((brand, index) => {
      console.log(`${index + 1}. ${brand.name} (${brand.url})`);
    });
    
    if (!scrapedBrands || scrapedBrands.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Scraper\'dan kategori bulunamadı',
        addedCount: 0,
        data: { added: [], existing: [] }
      });
    }
    
    // Get existing categories for this store
    const existingCategories = await Category.find({ store: storeId });
    const existingCategoryNames = existingCategories.map(cat => cat.name.toLowerCase());
    const existingCategorySlugs = existingCategories.map(cat => cat.slug);
    
    // Prepare categories to add
    const categoriesToAdd = [];
    const existingCategoriesFound = [];
    
    for (const brand of scrapedBrands) {
      const categoryName = brand.name;
      const categorySlug = brand.slug || categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      // Check if category already exists by name or slug
      if (!existingCategoryNames.includes(categoryName.toLowerCase()) && !existingCategorySlugs.includes(categorySlug)) {
        categoriesToAdd.push({
          name: categoryName,
          slug: categorySlug,
          store: storeId,
          level: 1, // Top level categories
          isActive: true,
          externalId: brand.id,
          externalUrl: brand.url,
          imageUrl: brand.imageUrl || null,
          sortOrder: categoriesToAdd.length + 1
        });
      } else {
        existingCategoriesFound.push(categoryName);
      }
    }
    
    // Bulk insert new categories
    let addedCategories = [];
    if (categoriesToAdd.length > 0) {
      console.log(`📝 Adding ${categoriesToAdd.length} new categories...`);
      addedCategories = await Category.insertMany(categoriesToAdd);
    }
    
    console.log(`✅ Sync completed: ${addedCategories.length} added, ${existingCategoriesFound.length} existing`);
    
    res.status(200).json({
      success: true,
      message: `${addedCategories.length} yeni kategori eklendi`,
      addedCount: addedCategories.length,
      data: {
        added: addedCategories,
        existing: existingCategoriesFound,
        totalScraped: scrapedBrands.length
      }
    });
    
  } catch (error) {
    console.error('❌ Category sync error:', error);
    return next(new ErrorResponse('Kategori senkronizasyonu başarısız: ' + error.message, 500));
  }
});



// @desc    Force refresh category cache
// @route   POST /api/stores/:storeId/categories/refresh-cache
// @access  Private


// @desc    Get category statistics for a store
// @route   GET /api/stores/:storeId/categories/stats
// @access  Private
exports.getCategoryStats = asyncHandler(async (req, res, next) => {
  const { storeId } = req.params;
  
  // Verify store exists
  const store = await Store.findById(storeId);
  if (!store) {
    return next(new ErrorResponse('Mağaza bulunamadı', 404));
  }
  
  const stats = await Category.aggregate([
    { $match: { store: mongoose.Types.ObjectId(storeId), isActive: true } },
    {
      $group: {
        _id: '$level',
        count: { $sum: 1 },
        totalProducts: { $sum: '$productCount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  const totalCategories = await Category.countDocuments({ store: storeId, isActive: true });
  
  res.status(200).json({
    success: true,
    data: {
      totalCategories,
      byLevel: stats
    }
  });
});