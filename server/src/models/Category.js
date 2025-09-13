const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Kategori adı gereklidir'],
    trim: true,
    maxlength: [100, 'Kategori adı 100 karakterden fazla olamaz']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: [500, 'Açıklama 500 karakterden fazla olamaz']
  },
  image: {
    type: String,
    default: ''
  },
  store: {
    type: mongoose.Schema.ObjectId,
    ref: 'Store',
    required: [true, 'Kategori bir mağazaya ait olmalıdır']
  },
  parent: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 0,
    min: 0,
    max: 2 // 0: Ana kategori, 1: Alt kategori, 2: Alt alt kategori
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  productCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for children categories
CategorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
  justOne: false
});

// Virtual for products in this category
CategorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  justOne: false
});

// Index for better performance
CategorySchema.index({ store: 1, parent: 1 });
CategorySchema.index({ store: 1, level: 1 });
CategorySchema.index({ slug: 1 });

// Pre-save middleware to generate slug
CategorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim('-'); // Remove leading/trailing hyphens
    
    // Add store ID to make slug unique across stores
    this.slug = `${this.store}-${this.slug}`;
  }
  
  this.updatedAt = Date.now();
  next();
});

// Static method to get category tree for a store
CategorySchema.statics.getCategoryTree = async function(storeId) {
  const categories = await this.find({ store: storeId, isActive: true })
    .sort({ level: 1, sortOrder: 1, name: 1 })
    .populate('children')
    .lean();
  
  // Build tree structure
  const categoryMap = {};
  const rootCategories = [];
  
  // First pass: create map
  categories.forEach(cat => {
    categoryMap[cat._id] = { ...cat, children: [] };
  });
  
  // Second pass: build tree
  categories.forEach(cat => {
    if (cat.parent) {
      if (categoryMap[cat.parent]) {
        categoryMap[cat.parent].children.push(categoryMap[cat._id]);
      }
    } else {
      rootCategories.push(categoryMap[cat._id]);
    }
  });
  
  return rootCategories;
};

// Static method to sync categories from scraped data
CategorySchema.statics.syncCategories = async function(storeId, scrapedCategories) {
  const syncResults = {
    added: [],
    existing: [],
    errors: []
  };
  
  for (const categoryData of scrapedCategories) {
    try {
      const existingCategory = await this.findOne({
        store: storeId,
        name: categoryData.name,
        level: categoryData.level || 0
      });
      
      if (existingCategory) {
        syncResults.existing.push({
          name: existingCategory.name,
          level: existingCategory.level,
          id: existingCategory._id
        });
      } else {
        // Find parent if specified
        let parentId = null;
        if (categoryData.parentName && categoryData.level > 0) {
          const parent = await this.findOne({
            store: storeId,
            name: categoryData.parentName,
            level: (categoryData.level - 1)
          });
          parentId = parent ? parent._id : null;
        }
        
        const newCategory = await this.create({
          name: categoryData.name,
          description: categoryData.description || '',
          image: categoryData.image || '',
          store: storeId,
          parent: parentId,
          level: categoryData.level || 0,
          sortOrder: categoryData.sortOrder || 0
        });
        
        syncResults.added.push({
          name: newCategory.name,
          level: newCategory.level,
          id: newCategory._id
        });
      }
    } catch (error) {
      syncResults.errors.push({
        category: categoryData.name,
        error: error.message
      });
    }
  }
  
  return syncResults;
};

module.exports = mongoose.model('Category', CategorySchema);