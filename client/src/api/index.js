// API Services Export
export { default as apiClient } from './apiClient';
export { default as authService } from './authService';
export { default as userService } from './userService';
export { API_ENDPOINTS, HTTP_METHODS, getHeaders } from './config';
export { default as API_BASE_URL } from './config';

// Health check service
import apiClient from './apiClient';
import { API_ENDPOINTS } from './config';

export const healthService = {
  async checkHealth() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.HEALTH);
      return response;
    } catch (error) {
      throw new Error(error.message || 'Health check failed');
    }
  }
};