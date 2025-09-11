import { buildApiUrl } from './externalApiConfig';

class ProductService {
  // Get products by brand URL from GoSport API
  async getProductsByBrand(brandUrl) {
    try {
      const apiUrl = buildApiUrl('GOSPORT', 'PRODUCTS');
      const response = await fetch(`${apiUrl}?href=${encodeURIComponent(brandUrl)}`, {
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
      console.error('Error fetching products by brand:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const productService = new ProductService();
export default productService;

// Export the class as well for potential direct usage
export { ProductService };