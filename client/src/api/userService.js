import apiClient from './apiClient';
import { API_ENDPOINTS } from './config';
import authService from './authService';

// User service
class UserService {
  // Get all users (Admin only)
  async getAllUsers(page = 1, limit = 10, search = '') {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No token found');
      }
      
      let endpoint = `${API_ENDPOINTS.USERS.GET_ALL}?page=${page}&limit=${limit}`;
      if (search) {
        endpoint += `&search=${encodeURIComponent(search)}`;
      }
      
      const response = await apiClient.get(endpoint, token);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to get users');
    }
  }

  // Get user statistics (Admin only)
  async getUserStats() {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await apiClient.get(API_ENDPOINTS.USERS.GET_STATS, token);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to get user statistics');
    }
  }

  // Get single user (Admin only)
  async getSingleUser(userId) {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await apiClient.get(`${API_ENDPOINTS.USERS.GET_SINGLE}/${userId}`, token);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to get user');
    }
  }

  // Update user (Admin only)
  async updateUser(userId, userData) {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await apiClient.put(`${API_ENDPOINTS.USERS.UPDATE}/${userId}`, userData, token);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to update user');
    }
  }

  // Toggle user status (Admin only)
  async toggleUserStatus(userId) {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await apiClient.put(`${API_ENDPOINTS.USERS.TOGGLE_STATUS}/${userId}/toggle-status`, {}, token);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to toggle user status');
    }
  }

  // Delete user (Admin only)
  async deleteUser(userId) {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await apiClient.delete(`${API_ENDPOINTS.USERS.DELETE}/${userId}`, token);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to delete user');
    }
  }
}

// Create and export a singleton instance
const userService = new UserService();
export default userService;