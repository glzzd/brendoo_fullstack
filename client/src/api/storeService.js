import apiClient from './apiClient';
import { API_ENDPOINTS } from './config';

// Store service
class StoreService {
  // Get all stores
  async getStores() {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await apiClient.get(API_ENDPOINTS.STORES.GET_ALL, token);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to get stores');
    }
  }

  // Get single store
  async getStore(id) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await apiClient.get(`${API_ENDPOINTS.STORES.GET_BY_ID}/${id}`, token);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to get store');
    }
  }

  // Create new store
  async createStore(storeData) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await apiClient.post(API_ENDPOINTS.STORES.CREATE, storeData, token);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to create store');
    }
  }

  // Update store
  async updateStore(id, storeData) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await apiClient.put(`${API_ENDPOINTS.STORES.UPDATE}/${id}`, storeData, token);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to update store');
    }
  }

  // Delete store
  async deleteStore(id) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await apiClient.delete(`${API_ENDPOINTS.STORES.DELETE}/${id}`, token);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to delete store');
    }
  }

  // Get stores in radius
  async getStoresInRadius(zipcode, distance) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await apiClient.get(`${API_ENDPOINTS.STORES.RADIUS}/${zipcode}/${distance}`, token);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to get stores in radius');
    }
  }
}

// Create and export a singleton instance
const storeService = new StoreService();
export default storeService;