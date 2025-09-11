import { buildApiUrl } from './externalApiConfig';

class BrandService {
  // Get all brands from GoSport API
  async getBrands() {
    try {
      const apiUrl = buildApiUrl('GOSPORT', 'BRANDS');
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Brand service error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch brands',
        data: null
      };
    }
  }
}

const brandService = new BrandService();
export default brandService;