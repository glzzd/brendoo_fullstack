import { externalApiConfig } from '../api/externalApiConfig';

const productService = {
  // Get products by brand from GoSport (DISABLED - using scraper instead)
  async getProductsByBrand(brandName) {
    console.log('⚠️ GoSport API service is disabled. Use scraper instead.');
    // TODO: Implement scraper integration
    throw new Error('GoSport API service is disabled. Use scraper instead.');
  },

  // Get products by brand using new GoSport scraper
  async getScraperProductsByBrand(brandUrl, brandName) {
    try {
      console.log(`🔍 Fetching products for brand: ${brandName} from scraper...`);
      
      const encodedBrandUrl = encodeURIComponent(brandUrl);
      const response = await fetch(
        `${externalApiConfig.GOSPORT.BASE_URL}${externalApiConfig.GOSPORT.ENDPOINTS.SCRAPER_PRODUCTS}/${encodedBrandUrl}?brandName=${encodeURIComponent(brandName)}`,
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
      console.log('✅ Successfully fetched scraper products:', data.count);
      
      return data;
    } catch (error) {
      console.error('❌ Error fetching scraper products:', error);
      throw error;
    }
  }
};

export default productService;