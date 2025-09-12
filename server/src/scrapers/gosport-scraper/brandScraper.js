const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

class BrandScraper {
  constructor() {
    this.baseUrl = 'https://www.gosport.az';
    this.brandsUrl = 'https://www.gosport.az/brands';
    
    // Cache for brands
    this.brandsCache = null;
    this.cacheExpiry = null;
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    
    // Disable SSL certificate verification
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false,
      keepAlive: true,
      maxSockets: 10
    });
  }

  /**
   * Scrape brands with pagination support
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Array>} Array of brand objects
   */
  async scrapeBrands(page = 1, limit = 50) {
    try {
      console.log(`🔍 Scraping brands from page ${page}...`);
      
      const pageUrl = page === 1 ? this.brandsUrl : `${this.brandsUrl}?page=${page}`;
      const brands = await this.scrapeBrandsFromPage(pageUrl, page);
      
      // Apply limit
      const limitedBrands = brands.slice(0, limit);
      
      console.log(`✅ Found ${limitedBrands.length} brands on page ${page}`);
      return limitedBrands;
      
    } catch (error) {
      console.error('❌ Error in scrapeBrands:', error.message);
      throw error;
    }
  }

  /**
   * Get total number of pages by checking the first page
   * @returns {Promise<number>} Total number of pages
   */
  async getTotalPages() {
    try {
      const response = await axios.get(this.brandsUrl, {
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
      
      // Look for pagination elements
      const paginationLinks = $('.pagination a, .page-numbers a, [class*="page"] a');
      let maxPage = 1;
      
      paginationLinks.each((i, element) => {
        const pageText = $(element).text().trim();
        const pageNum = parseInt(pageText);
        if (!isNaN(pageNum) && pageNum > maxPage) {
          maxPage = pageNum;
        }
      });
      
      // Also check for "last" or "son" links
      const lastPageLink = $('a:contains("son"), a:contains("last"), a:contains("»")');
      if (lastPageLink.length > 0) {
        const href = lastPageLink.attr('href');
        if (href) {
          const pageMatch = href.match(/page=(\d+)/);
          if (pageMatch) {
            const lastPage = parseInt(pageMatch[1]);
            if (lastPage > maxPage) {
              maxPage = lastPage;
            }
          }
        }
      }
      
      console.log(`📊 Total pages detected: ${maxPage}`);
      return maxPage; // Safety limit removed
      
    } catch (error) {
      console.error('❌ Error getting total pages:', error.message);
      return 5; // Fallback to 5 pages
    }
  }

  /**
   * Scrape all brands from all pages using parallel processing
   * @returns {Promise<Array>} Array of all brand objects
   */
  async scrapeAllBrands() {
    try {
      // Check cache first
      if (this.brandsCache && this.cacheExpiry && Date.now() < this.cacheExpiry) {
        console.log('📦 Returning cached brands data');
        return this.brandsCache;
      }
      
      console.log('🔍 Starting brand scraping from GoSport.az...');
      
      // Get total number of pages
      const totalPages = await this.getTotalPages();
      console.log(`🚀 Processing ${totalPages} pages in parallel...`);
      
      // Create array of page URLs
      const pageUrls = [];
      for (let page = 1; page <= totalPages; page++) {
        const pageUrl = page === 1 ? this.brandsUrl : `${this.brandsUrl}?page=${page}`;
        pageUrls.push({ url: pageUrl, page });
      }
      
      // Process pages in smaller batches to avoid timeouts
      const batchSize = 3; // Process 3 pages at a time
      const allBrands = [];
      
      for (let i = 0; i < pageUrls.length; i += batchSize) {
        const batch = pageUrls.slice(i, i + batchSize);
        console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(pageUrls.length/batchSize)}...`);
        
        const batchPromises = batch.map(async ({ url, page }) => {
          try {
            const brands = await this.scrapeBrandsFromPage(url, page);
            console.log(`✅ Page ${page}: ${brands.length} brands`);
            return brands;
          } catch (error) {
            console.error(`❌ Error on page ${page}:`, error.message);
            return [];
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(brands => allBrands.push(...brands));
        
        // No delay needed when processing all at once
        // if (i + batchSize < pageUrls.length) {
        //   await this.delay(200);
        // }
      }
      
      // Remove duplicates based on brand name
      const uniqueBrands = [];
      const seenNames = new Set();
      
      for (const brand of allBrands) {
        if (!seenNames.has(brand.name)) {
          seenNames.add(brand.name);
          uniqueBrands.push(brand);
        }
      }
      
      console.log(`🎉 Brand scraping completed! Total unique brands: ${uniqueBrands.length}`);
      
      // Cache the results
      this.brandsCache = uniqueBrands;
      this.cacheExpiry = Date.now() + this.cacheTimeout;
      console.log('💾 Brands cached for 5 minutes');
      
      return uniqueBrands;
      
    } catch (error) {
      console.error('❌ Error in scrapeAllBrands:', error.message);
      throw error;
    }
  }

  /**
   * Scrape brands from a specific page
   * @param {string} pageUrl - URL of the page to scrape
   * @param {number} pageNumber - Page number for logging
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

      // Look for brand links
      $('a[href*="/brand/"]').each((index, element) => {
        const $element = $(element);
        const href = $element.attr('href');
        const name = $element.text().trim();
        
        // Look for image within the brand link
        const $img = $element.find('img');
        let imageUrl = null;
        
        if ($img.length > 0) {
          const imgSrc = $img.attr('src') || $img.attr('data-src');
          if (imgSrc) {
            imageUrl = imgSrc.startsWith('http') ? imgSrc : `${this.baseUrl}${imgSrc}`;
          }
        }
        
        if (href && name && name.length > 0) {
          const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
          
          // Extract brand ID from URL
          const urlParts = href.split('/');
          const brandSlug = urlParts[urlParts.length - 1];
          const idMatch = brandSlug.match(/-([0-9]+)$/);
          const brandId = idMatch ? idMatch[1] : index.toString();
          
          brands.push({
            id: brandId,
            name: name,
            url: fullUrl,
            slug: brandSlug,
            imageUrl: imageUrl,
            scrapedAt: new Date(),
            page: pageNumber
          });
        }
      });

      // Remove duplicates based on URL
      const uniqueBrands = brands.filter((brand, index, self) => 
        index === self.findIndex(b => b.url === brand.url)
      );

      return uniqueBrands;
      
    } catch (error) {
      console.error(`❌ Error scraping page ${pageNumber}:`, error.message);
      throw error;
    }
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
        timeout: 5000,
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

  /**
   * Clear the brands cache
   */
  clearCache() {
    this.brandsCache = null;
    this.cacheExpiry = null;
    console.log('🗑️ Brands cache cleared');
  }

  /**
   * Get brand statistics
   * @returns {Promise<Object>} Brand statistics
   */
  async getBrandStats() {
    try {
      const allBrands = await this.scrapeAllBrands();
      
      return {
        totalBrands: allBrands.length,
        lastScraped: new Date(),
        brands: allBrands
      };
      
    } catch (error) {
      console.error('❌ Error getting brand stats:', error.message);
      throw error;
    }
  }
}

module.exports = BrandScraper;