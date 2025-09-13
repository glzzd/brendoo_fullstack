const mongoose = require('mongoose');

const SizeSchema = new mongoose.Schema({
  sizeName: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: String,
    trim: true
  },
  discountedPrice: {
    type: String,
    trim: true
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    default: 0
  }
});

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
    maxlength: [200, 'Product name cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  price: {
    type: String,
    trim: true
  },
  discountedPrice: {
    type: String,
    trim: true
  },
  images: [{
    type: String,
    trim: true
  }],
  sizes: [SizeSchema],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: false
  },
  categoryName: {
    type: String,
    trim: true,
    maxlength: [100, 'Category name cannot be more than 100 characters']
  },
  brand: {
    type: String,
    trim: true,
    maxlength: [100, 'Brand cannot be more than 100 characters']
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  url: {
    type: String,
    trim: true,
    maxlength: [500, 'URL cannot be more than 500 characters']
  },
  sku: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  inStock: {
    type: Boolean,
    default: true
  },
  stockStatus: {
    type: String,
    enum: ['in_stock', 'out_of_stock', 'limited_stock'],
    default: 'in_stock'
  },
  totalStock: {
    type: Number,
    default: 0
  },
  scrapedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt field before saving
ProductSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate total stock from sizes
  if (this.sizes && this.sizes.length > 0) {
    this.totalStock = this.sizes.reduce((total, size) => {
      return total + (size.stockQuantity || 0);
    }, 0);
    
    // Update stock status based on total stock
    if (this.totalStock === 0) {
      this.stockStatus = 'out_of_stock';
      this.inStock = false;
    } else if (this.totalStock <= 5) {
      this.stockStatus = 'limited_stock';
      this.inStock = true;
    } else {
      this.stockStatus = 'in_stock';
      this.inStock = true;
    }
  }
  
  next();
});

// Index for better performance
ProductSchema.index({ store: 1, isActive: 1 });
ProductSchema.index({ brand: 1, category: 1 });
ProductSchema.index({ sku: 1 });
ProductSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Product', ProductSchema);