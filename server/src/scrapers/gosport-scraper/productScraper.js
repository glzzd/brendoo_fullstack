const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

class ProductScraper {
  constructor() {
    this.baseUrl = 'https://www.gosport.az';
    
    // Disable SSL certificate verification
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false,
      keepAlive: true,
      maxSockets: 10
    });
  }

  /**
   * Scrape products from a brand page
   * @param {string} brandUrl - Brand page URL
   * @param {string} brandName - Brand name
   * @returns {Promise<Array>} Array of product objects
   */
  async scrapeProducts(brandUrl, brandName) {
    try {
      console.log(`🔍 Scraping products for brand: ${brandName}`);
      console.log(`📄 URL: ${brandUrl}`);
      
      const allProducts = [];
      let currentPage = 1;
      let hasMorePages = true;
      
      while (hasMorePages) {
        console.log(`📄 Scraping page ${currentPage} for ${brandName}...`);
        
        const pageUrl = currentPage === 1 ? brandUrl : `${brandUrl}?page=${currentPage}`;
        const pageProducts = await this.scrapeProductsFromPage(pageUrl, brandName, currentPage);
        
        if (pageProducts.length === 0) {
          console.log(`📄 No products found on page ${currentPage}, stopping...`);
          hasMorePages = false;
        } else {
          allProducts.push(...pageProducts);
          console.log(`✅ Found ${pageProducts.length} products on page ${currentPage}`);
          
          // Check if there are more pages
          hasMorePages = await this.hasNextPage(pageUrl, currentPage);
          currentPage++;
          
          // Add delay between requests
          await this.delay(300);
        }
        
        // Safety limit removed - scrape all available pages
        // Note: Be careful with very large brands as this might take a long time
      }
      
      console.log(`🎉 Product scraping completed for ${brandName}! Total products: ${allProducts.length}`);
      return allProducts;
      
    } catch (error) {
      console.error(`❌ Error scraping products for ${brandName}:`, error.message);
      throw error;
    }
  }

  /**
   * Scrape products from a specific page
   * @param {string} pageUrl - URL of the page to scrape
   * @param {string} brandName - Brand name
   * @param {number} pageNumber - Page number for logging
   * @returns {Promise<Array>} Array of product objects from this page
   */
  async scrapeProductsFromPage(pageUrl, brandName, pageNumber) {
    try {
      const response = await axios.get(pageUrl, {
        httpsAgent: this.httpsAgent,
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      const $ = cheerio.load(response.data);
      const products = [];

      // Look for product containers - GoSport uses specific structure
      $('a[href*="/product/"]').each((index, element) => {
        const $element = $(element);
        
        // Extract product information
        const name = this.extractProductName($element);
        const price = this.extractProductPrice($element);
        const image = this.extractProductImage($element);
        const url = this.extractProductUrl($element);
        const availability = this.extractProductAvailability($element);
        
        if (name && name.trim().length > 0) {
          products.push({
            id: `${brandName.toLowerCase()}-${index}-${Date.now()}`,
            name: name.trim(),
            price: price,
            originalPrice: price,
            currency: 'AZN',
            image: image,
            url: url,
            brand: brandName,
            availability: availability,
            scrapedAt: new Date(),
            page: pageNumber,
            source: 'gosport.az'
          });
        }
      });

      return products;
      
    } catch (error) {
      console.error(`❌ Error scraping page ${pageNumber} for ${brandName}:`, error.message);
      throw error;
    }
  }

  /**
   * Extract product name from element
   * @param {Object} $element - Cheerio element
   * @returns {string} Product name
   */
  extractProductName($element) {
    // For GoSport, product name is usually in the link text or title attribute
    const title = $element.attr('title');
    if (title && title.trim().length > 0 && !title.includes('{{')) {
      return title.trim();
    }
    
    // Try text content but filter out template variables
    const text = $element.text().trim();
    if (text && text.length > 0 && !text.includes('{{') && !text.includes('}}')) {
      return text.split('\n')[0].trim();
    }
    
    return '';
  }

  /**
   * Extract product price from element
   * @param {Object} $element - Cheerio element
   * @returns {number|null} Product price
   */
  extractProductPrice($element) {
    // Try multiple selectors for price
    const priceSelectors = [
      '.price',
      '.product-price',
      '[class*="price"]',
      '.cost',
      '.amount'
    ];
    
    for (const selector of priceSelectors) {
      const priceText = $element.find(selector).first().text().trim();
      if (priceText) {
        // Extract numeric value from price text
        const priceMatch = priceText.match(/([0-9]+(?:\.[0-9]+)?)/); 
        if (priceMatch) {
          return parseFloat(priceMatch[1]);
        }
      }
    }
    
    return null;
  }

  /**
   * Extract product image from element
   * @param {Object} $element - Cheerio element
   * @returns {string|null} Product image URL
   */
  extractProductImage($element) {
    // For GoSport, look for images within the link
    const $img = $element.find('img').first();
    if ($img.length > 0) {
      const src = $img.attr('src') || $img.attr('data-src') || $img.attr('data-original');
      if (src && !src.includes('product-loader.svg')) {
        return src.startsWith('http') ? src : `${this.baseUrl}${src}`;
      }
    }
    
    return null;
  }

  /**
   * Extract product URL from element
   * @param {Object} $element - Cheerio element
   * @returns {string|null} Product URL
   */
  extractProductUrl($element) {
    // For GoSport, the element itself is the link
    const href = $element.attr('href');
    if (href) {
      return href.startsWith('http') ? href : `${this.baseUrl}${href}`;
    }
    
    return null;
  }

  /**
   * Extract product availability from element
   * @param {Object} $element - Cheerio element
   * @returns {string} Product availability status
   */
  extractProductAvailability($element) {
    // Look for availability indicators
    const availabilitySelectors = [
      '.availability',
      '.stock',
      '[class*="stock"]',
      '[class*="available"]'
    ];
    
    for (const selector of availabilitySelectors) {
      const availabilityText = $element.find(selector).first().text().trim().toLowerCase();
      if (availabilityText) {
        if (availabilityText.includes('stokda') || availabilityText.includes('available')) {
          return 'in_stock';
        } else if (availabilityText.includes('yoxdur') || availabilityText.includes('out')) {
          return 'out_of_stock';
        }
      }
    }
    
    return 'unknown';
  }

  /**
   * Check if there are more pages available
   * @param {string} currentPageUrl - Current page URL
   * @param {number} currentPage - Current page number
   * @returns {Promise<boolean>} True if more pages exist
   */
  async hasNextPage(currentPageUrl, currentPage) {
    try {
      const response = await axios.get(currentPageUrl, {
        httpsAgent: this.httpsAgent,
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Look for pagination indicators
      const nextPageExists = $('a[href*="page="]').length > 0 || 
                           $('.pagination').length > 0 ||
                           $('[class*="next"]').length > 0;
      
      return nextPageExists; // Safety limit removed
      
    } catch (error) {
      console.error('❌ Error checking next page:', error.message);
      return false;
    }
  }

  /**
   * Add delay between requests
   * @param {number} ms - Milliseconds to wait
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ProductScraper;