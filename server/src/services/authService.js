const User = require('../models/User');
const jwt = require('jsonwebtoken');

class AuthService {
  // Register user
  async register(userData) {
    const { name, email, password } = userData;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    // Generate token
    const token = user.getSignedJwtToken();

    return {
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    };
  }

  // Login user
  async login(email, password) {
    // Validate email & password
    if (!email || !password) {
      throw new Error('Please provide an email and password');
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Generate token
    const token = user.getSignedJwtToken();

    return {
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    };
  }

  // Get current logged in user
  async getMe(userId) {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    return {
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    };
  }

  // Update user details
  async updateDetails(userId, updateData) {
    const fieldsToUpdate = {
      name: updateData.name,
      email: updateData.email
    };

    const user = await User.findByIdAndUpdate(userId, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        avatar: user.avatar,
        updatedAt: user.updatedAt
      }
    };
  }

  // Update password
  async updatePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new Error('User not found');
    }

    // Check current password
    if (!(await user.matchPassword(currentPassword))) {
      throw new Error('Password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    const token = user.getSignedJwtToken();

    return {
      success: true,
      token
    };
  }
}

module.exports = new AuthService();