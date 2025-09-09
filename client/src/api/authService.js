import apiClient from './apiClient';
import { API_ENDPOINTS } from './config';

// Authentication service
class AuthService {
  // Login user
  async login(email, password) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password
      });
      
      // Store token in localStorage if login successful
      if (response.success && response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('sidebarOpen', true);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  }

  // Register user
  async register(userData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData);
      
      // Store token in localStorage if registration successful
      if (response.success && response.token) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      throw new Error(error.message || 'Registration failed');
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await apiClient.get(API_ENDPOINTS.AUTH.ME, token);
      return response;
    } catch (error) {
      // If token is invalid, clear it
      this.logout();
      throw new Error(error.message || 'Failed to get user data');
    }
  }

  // Update user details
  async updateDetails(userData) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await apiClient.put(API_ENDPOINTS.AUTH.UPDATE_DETAILS, userData, token);
      
      // Update user data in localStorage
      if (response.success && response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
      }
      
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to update user details');
    }
  }

  // Update password
  async updatePassword(currentPassword, newPassword) {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await apiClient.put(API_ENDPOINTS.AUTH.UPDATE_PASSWORD, {
        currentPassword,
        newPassword
      }, token);
      
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to update password');
    }
  }

  // Logout user
  async logout() {
    try {
      const token = this.getToken();
      
      // Call logout endpoint if token exists
      if (token) {
        await apiClient.get(API_ENDPOINTS.AUTH.LOGOUT, token);
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('language');
      localStorage.removeItem('sidebarOpen');
      localStorage.removeItem('user');
    }
  }

  // Get token from localStorage
  getToken() {
    return localStorage.getItem('token');
  }

  // Get user from localStorage
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  // Check token expiration (basic check)
  isTokenExpired() {
    const token = this.getToken();
    if (!token) return true;
    
    try {
      // Decode JWT token (basic decode, not verification)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;