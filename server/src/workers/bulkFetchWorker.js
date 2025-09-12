const simpleQueue = require('../config/simpleQueue');
const bulkFetchService = require('../services/bulkFetchService');
const socketManager = require('../config/socket');
const axios = require('axios');
const cheerio = require('cheerio');

class BulkFetchWorker {
  constructor() {
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️ Bulk fetch worker is already running');
      return;
    }

    try {
      // Connect to SimpleQueue
      await simpleQueue.connect();
      
      this.isRunning = true;
      console.log('🚀 Bulk fetch worker started');

      // Start consuming jobs
      await simpleQueue.consumeJobs('bulk_fetch_queue', this.processBrandJob.bind(this));
      
    } catch (error) {
      console.error('❌ Failed to start bulk fetch worker:', error);
      this.isRunning = false;
      throw error;
    }
  }

  async processBrandJob(jobData, message, retryCount = 0) {
    const { jobId, brandIndex, brandName, brandUrl, storeId, userId, totalBrands } = jobData;
    const maxRetries = 5; // Increased retry count
    
    console.log(`🔄 Processing brand ${brandIndex + 1}/${totalBrands}: ${brandName} (attempt ${retryCount + 1})`);

    try {
      // Fetch products from brand URL with timeout
      const products = await Promise.race([
        this.scrapeGoSportProducts(brandUrl, brandName),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Brand processing timeout')), 240000) // Increased to 4 minutes
        )
      ]);
      
      // Update job progress
      bulkFetchService.updateJobProgress(jobId, {
        brandName,
        brandUrl,
        success: true,
        products,
        error: null
      });

      console.log(`✅ Successfully processed ${brandName}: ${products.length} products`);
      
      // Emit progress update via WebSocket
      this.emitProgressUpdate(jobId, {
        brandName,
        brandIndex,
        totalBrands,
        products,
        status: 'completed'
      });

      // Job automatically removed from queue after processing

    } catch (error) {
      console.error(`❌ Error processing brand ${brandName} (attempt ${retryCount + 1}):`, error.message);
      
      if (retryCount < maxRetries) {
        // Retry with exponential backoff - increased delays for backend API
        const delay = Math.min(10000 * Math.pow(2, retryCount), 120000); // Max 2 minutes
        console.log(`🔄 Retrying brand ${brandName} in ${delay}ms...`);
        
        setTimeout(async () => {
          await this.processBrandJob(jobData, message, retryCount + 1);
        }, delay);
        
        return; // Don't ack or nack yet
      }
      
      // Max retries reached
      console.error(`💀 Brand ${brandName} failed after ${maxRetries} attempts`);
      
      // Update job progress with error
      bulkFetchService.updateJobProgress(jobId, {
        brandName,
        brandUrl,
        success: false,
        products: [],
        error: `Failed after ${maxRetries} attempts: ${error.message}`
      });

      // Emit error update via WebSocket
      this.emitProgressUpdate(jobId, {
        brandName,
        brandIndex,
        totalBrands,
        products: [],
        status: 'failed',
        error: `Failed after ${maxRetries} attempts: ${error.message}`
      });
      
      // Send to dead letter queue
      await simpleQueue.publishJob('dead_letter_queue', {
        ...jobData,
        finalError: error.message,
        retryCount
      });
      
      // Job automatically removed from queue after processing
    }
  }

  async scrapeGoSportProducts(brandUrl, brandName) {
    const products = [];
    
    try {
      console.log(`🔍 Starting GoSport product scraping for ${brandName}`);
      
      // Use new gosport-scraper integration
      const goSportScraper = require('../scrapers/gosport-scraper');
      const scrapedProducts = await goSportScraper.getProductsByBrand(brandUrl, brandName);
      
      // Convert scraped products to expected format
      scrapedProducts.forEach((product, index) => {
        try {
          if (product && product.name) {
            products.push({
              name: product.name.trim(),
              price: product.price || 'N/A',
              image: product.image || '',
              link: product.url || brandUrl,
              brand: brandName,
              source: 'gosport-scraper',
              scrapedAt: new Date()
            });
          }
        } catch (productError) {
          console.warn(`⚠️ Error processing product ${index}:`, productError.message);
        }
      });
      
      console.log(`✅ Found ${products.length} products for ${brandName} via new scraper`);
      return products;

    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout - website took too long to respond');
      } else if (error.response) {
        throw new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
      } else if (error.request) {
        throw new Error('Network error - unable to reach website');
      } else {
        throw new Error(`Scraping error: ${error.message}`);
      }
    }
  }

  extractProductName($product, $) {
    const selectors = [
      '.product-name', '.product-title', '.title', 'h1', 'h2', 'h3',
      '[data-product-name]', '.name', '.product-item-name',
      'a[title]', '.product-link'
    ];

    for (const selector of selectors) {
      const element = $product.find(selector).first();
      if (element.length) {
        const text = element.attr('title') || element.text();
        if (text && text.trim()) {
          return text.trim();
        }
      }
    }

    return null;
  }

  extractProductPrice($product, $) {
    const selectors = [
      '.price', '.product-price', '.cost', '.amount',
      '[data-price]', '.price-current', '.sale-price',
      '.regular-price', '.final-price'
    ];

    for (const selector of selectors) {
      const element = $product.find(selector).first();
      if (element.length) {
        const text = element.attr('data-price') || element.text();
        if (text && text.trim()) {
          return text.trim();
        }
      }
    }

    return null;
  }

  extractProductImage($product, $, baseUrl) {
    const selectors = [
      'img', '.product-image img', '.image img',
      '[data-product-image]', '.product-photo img'
    ];

    for (const selector of selectors) {
      const element = $product.find(selector).first();
      if (element.length) {
        let src = element.attr('src') || element.attr('data-src') || element.attr('data-lazy');
        if (src) {
          // Convert relative URLs to absolute
          if (src.startsWith('//')) {
            src = 'https:' + src;
          } else if (src.startsWith('/')) {
            const urlObj = new URL(baseUrl);
            src = urlObj.origin + src;
          } else if (!src.startsWith('http')) {
            src = new URL(src, baseUrl).href;
          }
          return src;
        }
      }
    }

    return null;
  }

  extractProductLink($product, $, baseUrl) {
    const selectors = [
      'a', '.product-link', '.product-url',
      '[data-product-url]', '.title a', '.name a'
    ];

    for (const selector of selectors) {
      const element = $product.find(selector).first();
      if (element.length) {
        let href = element.attr('href');
        if (href) {
          // Convert relative URLs to absolute
          if (href.startsWith('//')) {
            href = 'https:' + href;
          } else if (href.startsWith('/')) {
            const urlObj = new URL(baseUrl);
            href = urlObj.origin + href;
          } else if (!href.startsWith('http')) {
            href = new URL(href, baseUrl).href;
          }
          return href;
        }
      }
    }

    return null;
  }

  emitProgressUpdate(jobId, data) {
    // Emit progress via WebSocket
    if (data.status === 'completed') {
      socketManager.emitJobProgress(jobId, data);
    } else if (data.status === 'failed') {
      socketManager.emitJobError(jobId, data);
    }
    
    // Also log for debugging
    console.log(`📊 Progress update for job ${jobId}:`, {
      brand: data.brandName,
      progress: `${data.brandIndex + 1}/${data.totalBrands}`,
      status: data.status,
      products: data.products.length
    });
  }

  async stop() {
    if (!this.isRunning) {
      console.log('⚠️ Bulk fetch worker is not running');
      return;
    }

    try {
      await simpleQueue.close();
      this.isRunning = false;
      console.log('🛑 Bulk fetch worker stopped');
    } catch (error) {
      console.error('❌ Error stopping bulk fetch worker:', error);
    }
  }

  isWorkerRunning() {
    return this.isRunning;
  }
}

// Singleton instance
const bulkFetchWorker = new BulkFetchWorker();

module.exports = bulkFetchWorker;