const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

class BrandScraperService {
  constructor() {
    this.baseUrl = 'https://www.gosport.az';
    this.brandsUrl = 'https://www.gosport.az/brands';
    
    // Disable SSL certificate verification
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false,
      keepAlive: true,
      maxSockets: 10
    });
  }

  /**
   * Scrape all brands from GoSport.az with pagination support
   * @returns {Promise<Array>} Array of brand objects
   */
  async scrapeAllBrands() {
    try {
      console.log('🔍 Starting brand scraping from GoSport.az...');
      
      const allBrands = [];
      let currentPage = 1;
      let hasMorePages = true;
      
      while (hasMorePages) {
        console.log(`📄 Scraping page ${currentPage}...`);
        
        const pageUrl = currentPage === 1 ? this.brandsUrl : `${this.brandsUrl}?page=${currentPage}`;
        const pageBrands = await this.scrapeBrandsFromPage(pageUrl, currentPage);
        
        if (pageBrands.length === 0) {
          console.log(`📄 No brands found on page ${currentPage}, stopping...`);
          hasMorePages = false;
        } else {
          allBrands.push(...pageBrands);
          console.log(`✅ Found ${pageBrands.length} brands on page ${currentPage}`);
          
          // Check if there are more pages by looking for next page link
          hasMorePages = await this.hasNextPage(pageUrl, currentPage);
          currentPage++;
          
          // Add delay between requests to be respectful
          await this.delay(1000);
        }
        
        // Safety limit removed - scrape all available pages
        // Note: Be careful as this might take a long time for sites with many pages
      }
      
      console.log(`🎉 Brand scraping completed! Total brands found: ${allBrands.length}`);
      return allBrands;
      
    } catch (error) {
      console.error('❌ Error in scrapeAllBrands:', error.message);
      throw error;
    }
  }

  /**
   * Scrape brands with pagination support
   * @param {number} page - Page number to scrape (default: 1)
   * @param {number} limit - Number of brands per page (default: 50)
   * @returns {Promise<Object>} Object with brands array and pagination info
   */
  async scrapeBrands(page = 1, limit = 50) {
    try {
      console.log(`🔍 Scraping brands from page ${page} with limit ${limit}...`);
      
      const pageUrl = page === 1 ? this.brandsUrl : `${this.brandsUrl}?page=${page}`;
      const brands = await this.scrapeBrandsFromPage(pageUrl, page);
      
      // Apply limit
      const startIndex = 0;
      const endIndex = Math.min(limit, brands.length);
      const limitedBrands = brands.slice(startIndex, endIndex);
      
      return {
        brands: limitedBrands,
        pagination: {
          currentPage: page,
          totalBrands: limitedBrands.length,
          hasMore: brands.length > limit
        }
      };
      
    } catch (error) {
      console.error('❌ Error in scrapeBrands:', error.message);
      throw error;
    }
  }

  /**
   * Scrape brands from a specific page
   * @param {string} pageUrl - URL of the page to scrape
   * @param {number} pageNumber - Current page number
   * @returns {Promise<Array>} Array of brand objects from this page
   */
  async scrapeBrandsFromPage(pageUrl, pageNumber) {
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
      const brands = [];
      
      // Extract brand links
      $('a[href*="/brand/"]').each((index, element) => {
        const $el = $(element);
        const href = $el.attr('href');
        const name = $el.text().trim();
        
        // Skip empty names or navigation links
        if (name && name !== 'Brendlər' && href && href.includes('/brand/')) {
          // Ensure full URL
          const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
          
          // Extract brand ID from URL (e.g., nike-21 -> 21)
          const brandIdMatch = href.match(/\/brand\/[^-]+-?(\d+)$/);
          const brandId = brandIdMatch ? brandIdMatch[1] : null;
          
          // Check if brand already exists in array (avoid duplicates)
          const existingBrand = brands.find(b => b.url === fullUrl || b.name === name);
          if (!existingBrand) {
            brands.push({
              id: brandId,
              name: name,
              url: fullUrl,
              slug: href.split('/').pop(),
              scrapedAt: new Date(),
              page: pageNumber
            });
          }
        }
      });
      
      return brands;
      
    } catch (error) {
      console.error(`❌ Error scraping page ${pageNumber}:`, error.message);
      return [];
    }
  }

  /**
   * Check if there are more pages available
   * @param {string} currentPageUrl - Current page URL
   * @param {number} currentPageNumber - Current page number
   * @returns {Promise<boolean>} True if more pages exist
   */
  async hasNextPage(currentPageUrl, currentPageNumber) {
    try {
      const response = await axios.get(currentPageUrl, {
        httpsAgent: this.httpsAgent,
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      
      // Look for pagination indicators
      const nextPageExists = (
        // Check for next page number
        $(`:contains("${currentPageNumber + 1}")`).length > 0 ||
        // Check for "next" button or arrow
        $('a:contains("›"), a:contains("Next"), a:contains("Növbəti")').length > 0 ||
        // Check for pagination with higher page numbers
        $(`a[href*="page=${currentPageNumber + 1}"]`).length > 0
      );
      
      return nextPageExists;
      
    } catch (error) {
      console.error('❌ Error checking next page:', error.message);
      return false;
    }
  }

  /**
   * Get brands with caching support
   * @param {boolean} forceRefresh - Force refresh from website
   * @returns {Promise<Array>} Array of brand objects
   */
  async getBrands(forceRefresh = false) {
    try {
      // In a real application, you might want to implement caching here
      // For now, always scrape fresh data
      return await this.scrapeAllBrands();
      
    } catch (error) {
      console.error('❌ Error in getBrands:', error.message);
      throw error;
    }
  }

  /**
   * Get a specific brand by name or ID
   * @param {string} identifier - Brand name or ID
   * @returns {Promise<Object|null>} Brand object or null if not found
   */
  async getBrandByIdentifier(identifier) {
    try {
      const allBrands = await this.getBrands();
      
      return allBrands.find(brand => 
        brand.name.toLowerCase() === identifier.toLowerCase() ||
        brand.id === identifier ||
        brand.slug === identifier
      ) || null;
      
    } catch (error) {
      console.error('❌ Error in getBrandByIdentifier:', error.message);
      return null;
    }
  }

  /**
   * Utility function to add delay between requests
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get brand statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getBrandStats() {
    try {
      const brands = await this.getBrands();
      
      return {
        totalBrands: brands.length,
        lastScraped: new Date(),
        brandNames: brands.map(b => b.name).sort(),
        pagesScraped: Math.max(...brands.map(b => b.page || 1))
      };
      
    } catch (error) {
      console.error('❌ Error in getBrandStats:', error.message);
      throw error;
    }
  }
}

module.exports = new BrandScraperService();