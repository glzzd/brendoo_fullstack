const mongoose = require('mongoose');

const StoreSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a store name'],
    trim: true,
    maxlength: [100, 'Store name cannot be more than 100 characters']
  },
  website: {
    type: String,
    required: [true, 'Please add a store website'],
    trim: true,
    maxlength: [50, 'Store website cannot be more than 50 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  logo: {
    type: String,
    trim: true,
    maxlength: [5000000, 'Logo size cannot exceed 5MB']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
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
StoreSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Populate owner information when querying
// Removed pre middleware to fix filtering issue
// Populate will be done manually in controllers when needed

module.exports = mongoose.model('Store', StoreSchema);