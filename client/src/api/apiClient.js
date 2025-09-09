import API_BASE_URL, { getHeaders } from './config';

// Generic API client class
class ApiClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: getHeaders(options.token),
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          // If response is not JSON, use default error message
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, token = null) {
    return this.request(endpoint, {
      method: 'GET',
      token
    });
  }

  // POST request
  async post(endpoint, data = {}, token = null) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      token
    });
  }

  // PUT request
  async put(endpoint, data = {}, token = null) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      token
    });
  }

  // DELETE request
  async delete(endpoint, token = null) {
    return this.request(endpoint, {
      method: 'DELETE',
      token
    });
  }
}

// Create and export a singleton instance
const apiClient = new ApiClient();
export default apiClient;