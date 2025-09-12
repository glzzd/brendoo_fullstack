// ProductService temporarily disabled - old GoSport API removed
// TODO: Implement new gosport-scraper integration

class ProductService {
  async getProductsByBrand(brandUrl) {
    throw new Error('Product service temporarily disabled - awaiting new scraper implementation');
  }
}

const productService = new ProductService();
export default productService;
export { ProductService };