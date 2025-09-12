import { externalApiConfig } from '../api/externalApiConfig';

const brandService = {
  // Get all scraped brands from GoSport
  async getAllScrapedBrands() {
    try {
      console.log('🔍 Fetching all scraped brands from GoSport...');
      
      const response = await fetch(
        `${externalApiConfig.GOSPORT.BASE_URL}${externalApiConfig.GOSPORT.ENDPOINTS.ALL_SCRAPED_BRANDS}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Successfully fetched scraped brands:', data.count);
      
      return data;
    } catch (error) {
      console.error('❌ Error fetching scraped brands:', error);
      throw error;
    }
  },

  // Get brands using new GoSport scraper (with pagination)
  async getScraperBrands(page = 1, limit = 50) {
    try {
      console.log(`🔍 Fetching brands from GoSport scraper (page: ${page}, limit: ${limit})...`);
      
      const response = await fetch(
        `${externalApiConfig.GOSPORT.BASE_URL}${externalApiConfig.GOSPORT.ENDPOINTS.SCRAPER_BRANDS}?page=${page}&limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Successfully fetched scraper brands:', data.count);
      
      return data;
    } catch (error) {
      console.error('❌ Error fetching scraper brands:', error);
      throw error;
    }
  },

  // Get all brands using new GoSport scraper
  async getScraperAllBrands() {
    try {
      console.log('🔍 Fetching all brands from GoSport scraper...');
      
      const response = await fetch(
        `${externalApiConfig.GOSPORT.BASE_URL}${externalApiConfig.GOSPORT.ENDPOINTS.SCRAPER_ALL_BRANDS}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Successfully fetched all scraper brands:', data.count);
      
      return data;
    } catch (error) {
      console.error('❌ Error fetching all scraper brands:', error);
      throw error;
    }
  }
};

export default brandService;