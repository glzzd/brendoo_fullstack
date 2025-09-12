const BrandScraper = require('./brandScraper');
const ProductScraper = require('./productScraper');

class GoSportScraper {
  constructor() {
    this.brandScraper = new BrandScraper();
    this.productScraper = new ProductScraper();
  }

  // Get all brands
  async getBrands(page = 1, limit = 50) {
    return await this.brandScraper.scrapeBrands(page, limit);
  }

  // Get all brands (all pages)
  async getAllBrands() {
    return await this.brandScraper.scrapeAllBrands();
  }

  // Get products by brand URL
  async getProductsByBrand(brandUrl, brandName) {
    return await this.productScraper.scrapeProducts(brandUrl, brandName);
  }
}

module.exports = new GoSportScraper();