// External API endpoints configuration
// This file contains all external API endpoints used in the application
// Update these URLs when deploying to different environments

const EXTERNAL_API_CONFIG = {
  // GoSport API Configuration
  GOSPORT: {
    BASE_URL: 'http://localhost:3001/api/gosport',
    ENDPOINTS: {
      SCRAPED_BRANDS: '/scraped-brands',
      ALL_SCRAPED_BRANDS: '/all-scraped-brands',
      SCRAPER_BRANDS: '/scraper-brands',
      SCRAPER_ALL_BRANDS: '/scraper-all-brands',
      SCRAPER_PRODUCTS: '/scraper-products'
    }
  },
  
  // Add other external APIs here as needed
  // EXAMPLE_API: {
  //   BASE_URL: 'https://api.example.com',
  //   ENDPOINTS: {
  //     USERS: '/users',
  //     POSTS: '/posts'
  //   }
  // }
};

// Helper function to build full URL
export const buildApiUrl = (apiName, endpoint) => {
  const apiConfig = EXTERNAL_API_CONFIG[apiName];
  if (!apiConfig) {
    throw new Error(`API configuration not found for: ${apiName}`);
  }
  
  const endpointPath = apiConfig.ENDPOINTS[endpoint];
  if (!endpointPath) {
    throw new Error(`Endpoint not found: ${endpoint} for API: ${apiName}`);
  }
  
  return `${apiConfig.BASE_URL}${endpointPath}`;
};

export { EXTERNAL_API_CONFIG as externalApiConfig };
export default EXTERNAL_API_CONFIG;