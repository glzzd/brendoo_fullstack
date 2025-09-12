import { buildApiUrl } from './externalApiConfig';

class BrandService {


  // Get scraped brands from GoSport.az
  async getScrapedBrands(page = 1, limit = 50) {
    try {
      const apiUrl = buildApiUrl('GOSPORT', 'SCRAPED_BRANDS');
      const url = `${apiUrl}?page=${page}&limit=${limit}`;
      
      const response = await fetch(url, {
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
      console.error('Scraped brands service error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch scraped brands',
        data: null
      };
    }
  }

  // Get all scraped brands from GoSport.az
  async getAllScrapedBrands() {
    try {
      const apiUrl = buildApiUrl('GOSPORT', 'ALL_SCRAPED_BRANDS');
      
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
      console.error('All scraped brands service error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch all scraped brands',
        data: null
      };
    }
  }
}

const brandService = new BrandService();
export default brandService;