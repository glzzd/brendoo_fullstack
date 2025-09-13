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
        
        try {
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
        } catch (error) {
          console.error(`❌ Error scraping page ${currentPage} for ${brandName}: ${error.message}`);
          console.log(`⏭️ Skipping page ${currentPage} and continuing with next page...`);
          
          // Continue to next page even if current page fails
          currentPage++;
          
          // Check if we should continue (avoid infinite loop)
          if (currentPage > 200) { // Safety limit
            console.log(`⚠️ Reached safety limit of 200 pages, stopping...`);
            hasMorePages = false;
          } else {
            // Try to check if there are more pages using the original URL
            try {
              const basePageUrl = currentPage === 1 ? brandUrl : `${brandUrl}?page=${currentPage}`;
              hasMorePages = await this.hasNextPage(basePageUrl, currentPage);
            } catch (nextPageError) {
              console.log(`⚠️ Cannot check next page, assuming no more pages...`);
              hasMorePages = false;
            }
          }
          
          // Add delay before trying next page
          await this.delay(500);
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
      const productPromises = [];
      
      $('a[href*="/product/"]').each((index, element) => {
        const $element = $(element);
        
        // Find the product card container that contains price information
        let $productCard = $element;
        const possibleContainers = [
          $element.closest('.col'),
          $element.closest('[class*="col"]'),
          $element.closest('.card'),
          $element.closest('.product'),
          $element.closest('[class*="product"]'),
          $element.parent(),
          $element.parent().parent()
        ];
        
        // Find container that has price information (contains AZN)
        for (const container of possibleContainers) {
          if (container.length > 0) {
            const containerText = container.text();
            if (containerText && containerText.includes('AZN')) {
              $productCard = container;
              break;
            }
          }
        }
        
        // Extract product information from the correct container
        const name = this.extractProductName($element);
        const priceInfo = this.extractProductPrice($productCard); // Use product card for price
        const image = this.extractProductImage($element);
        const url = this.extractProductUrl($element);
        const availability = this.extractProductAvailability($productCard); // Use product card for availability
        
        if (name && name.trim().length > 0) {
          const productData = {
            id: `${brandName.toLowerCase()}-${index}-${Date.now()}`,
            name: name.trim(),
            price: priceInfo.currentPrice,
            originalPrice: priceInfo.originalPrice || priceInfo.currentPrice,
            isDiscounted: priceInfo.isDiscounted,
            currency: 'AZN',
            image: image,
            url: url,
            brand: brandName,
            availability: availability,
            scrapedAt: new Date(),
            page: pageNumber,
            source: 'gosport.az'
          };
          
          // Create promise to scrape additional images and sizes
          if (url) {
            const detailPromise = Promise.all([
              this.scrapeProductImages(url),
              this.scrapeProductSizes(url)
            ])
              .then(([additionalImages, sizes]) => {
                productData.additionalImages = additionalImages;
                productData.sizes = sizes;
                return productData;
              })
              .catch(error => {
                console.warn(`⚠️ Failed to get additional details for ${name}:`, error.message);
                productData.additionalImages = [];
                productData.sizes = [];
                return productData;
              });
            
            productPromises.push(detailPromise);
          } else {
            productData.additionalImages = [];
            productData.sizes = [];
            productPromises.push(Promise.resolve(productData));
          }
        }
      });
      
      // Wait for all image scraping to complete
      const productsWithImages = await Promise.all(productPromises);
      products.push(...productsWithImages);

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
   * @returns {Object} Product price information with current and original prices
   */
  extractProductPrice($element) {
    let currentPrice = null;
    let originalPrice = null;
    
    // Try to find current price in product-price class first
    const productPriceText = $element.find('.product-price').first().text().trim();
    if (productPriceText) {
      const priceMatch = productPriceText.match(/([0-9]+(?:\.[0-9]+)?)/); 
      if (priceMatch) {
        currentPrice = parseFloat(priceMatch[1]);
      }
    }
    
    // Try to find current price in text-primary class
    if (!currentPrice) {
      const currentPriceText = $element.find('.text-primary').first().text().trim();
      if (currentPriceText) {
        const priceMatch = currentPriceText.match(/([0-9]+(?:\.[0-9]+)?)/); 
        if (priceMatch) {
          currentPrice = parseFloat(priceMatch[1]);
        }
      }
    }
    
    // Try to find original price in del tags (not visually-hidden)
    const originalPriceText = $element.find('del:not(.visually-hidden)').first().text().trim();
    if (originalPriceText) {
      const priceMatch = originalPriceText.match(/([0-9]+(?:\.[0-9]+)?)/); 
      if (priceMatch) {
        originalPrice = parseFloat(priceMatch[1]);
      }
    }
    
    // If no current price found, try other selectors
    if (!currentPrice) {
      const priceSelectors = [
        '.price',
        '[class*="price"]',
        '.cost',
        '.amount',
        '.fs-5', // Based on HTML structure seen
        '.fw-bold' // Based on HTML structure seen
      ];
      
      for (const selector of priceSelectors) {
        const priceText = $element.find(selector).first().text().trim();
        if (priceText) {
          const priceMatch = priceText.match(/([0-9]+(?:\.[0-9]+)?)/); 
          if (priceMatch) {
            currentPrice = parseFloat(priceMatch[1]);
            break;
          }
        }
      }
    }
    
    // If still no price, try to extract from any text containing AZN
    if (!currentPrice) {
      const allText = $element.text();
      const aznMatch = allText.match(/([0-9]+(?:\.[0-9]+)?)\s*AZN/i);
      if (aznMatch) {
        currentPrice = parseFloat(aznMatch[1]);
      }
    }
    
    return {
      currentPrice: currentPrice,
      originalPrice: originalPrice,
      isDiscounted: originalPrice && currentPrice && originalPrice > currentPrice
    };
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
   * Scrape additional images from product detail page
   * @param {string} productUrl - Product detail page URL
   * @returns {Promise<Array>} Array of additional image URLs
   */
  async scrapeProductImages(productUrl) {
    try {
      console.log(`🖼️ Scraping additional images from: ${productUrl}`);
      
      const response = await axios.get(productUrl, {
        httpsAgent: this.httpsAgent,
        timeout: 15000,
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
      const additionalImages = [];
      const seenImages = new Set();

      // Common selectors for product image galleries
      const imageSelectors = [
        '.product-gallery img',
        '.product-images img', 
        '.gallery img',
        '.slider img',
        '.product-slider img',
        '.image-gallery img',
        '[class*="gallery"] img',
        '[class*="slider"] img',
        '[data-gallery] img',
        '.swiper-slide img',
        '.carousel img'
      ];

      // Try each selector to find product images
      for (const selector of imageSelectors) {
        $(selector).each((index, element) => {
          const $img = $(element);
          let src = $img.attr('src') || $img.attr('data-src') || $img.attr('data-original') || $img.attr('data-lazy');
          
          if (src && !src.includes('product-loader.svg') && !src.includes('placeholder')) {
            // Convert relative URLs to absolute
            if (!src.startsWith('http')) {
              src = src.startsWith('/') ? `${this.baseUrl}${src}` : `${this.baseUrl}/${src}`;
            }
            
            // Avoid duplicates
            if (!seenImages.has(src)) {
              seenImages.add(src);
              additionalImages.push(src);
            }
          }
        });
        
        // If we found images with this selector, break to avoid duplicates
        if (additionalImages.length > 0) {
          break;
        }
      }

      // If no gallery images found, try to find any product-related images
      if (additionalImages.length === 0) {
        $('img').each((index, element) => {
          const $img = $(element);
          const src = $img.attr('src') || $img.attr('data-src') || $img.attr('data-original');
          const alt = $img.attr('alt') || '';
          
          if (src && 
              !src.includes('product-loader.svg') && 
              !src.includes('placeholder') &&
              !src.includes('logo') &&
              !src.includes('icon') &&
              (alt.toLowerCase().includes('product') || 
               src.includes('product') || 
               $img.closest('[class*="product"]').length > 0)) {
            
            const fullSrc = src.startsWith('http') ? src : `${this.baseUrl}${src}`;
            if (!seenImages.has(fullSrc)) {
              seenImages.add(fullSrc);
              additionalImages.push(fullSrc);
            }
          }
        });
      }

      console.log(`🖼️ Found ${additionalImages.length} additional images for product`);
      return additionalImages.slice(0, 10); // Limit to 10 images max
      
    } catch (error) {
      console.warn(`⚠️ Could not scrape additional images from ${productUrl}:`, error.message);
      return [];
    }
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
   * Scrape product sizes and stock information from product detail page
   * @param {string} productUrl - Product detail page URL
   * @returns {Promise<Array>} Array of size objects with stock info
   */
  async scrapeProductSizes(productUrl) {
    try {
      console.log(`📏 Scraping sizes from: ${productUrl}`);
      
      const response = await axios.get(productUrl, {
        httpsAgent: this.httpsAgent,
        timeout: 15000,
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
      const sizes = [];
      
      // First, try to find the main product ID from the page
      let mainProductId = null;
      
      // Try to extract product ID from URL or page data
      const urlMatch = productUrl.match(/-(\d+)$/);
      if (urlMatch) {
        mainProductId = parseInt(urlMatch[1]);
        console.log(`🎯 Main product ID from URL: ${mainProductId}`);
      }

      // Look for radio inputs with stock data in value attribute (name starts with 'stock_')
      $('input[type="radio"][name^="stock_"]').each((index, element) => {
        const $input = $(element);
        const inputValue = $input.attr('value');
        const inputId = $input.attr('id');
        
        if (inputValue) {
          try {
            // Parse JSON data from input value
            const sizeData = JSON.parse(inputValue);
            
            // Get size name from nested size object
            let sizeName = null;
            if (sizeData.size && sizeData.size.size) {
              sizeName = sizeData.size.size.toString();
            }
            
            // Filter by main product ID if available
            const shouldInclude = !mainProductId || sizeData.product_id === mainProductId;
            
            if (sizeName && shouldInclude) {
              const isAvailable = sizeData.count > 0;
              
              const sizeObj = {
                sizeName: sizeName,
                size: sizeName,
                sizeId: sizeData.size_id || (sizeData.size ? sizeData.size.id : null),
                productId: sizeData.product_id,
                isAvailable: isAvailable,
                stock: sizeData.count || 0,
                price: sizeData.price || null,
                discountedPrice: sizeData.discounted_price || null,
                barcode: sizeData.barcode || null,
                createdAt: sizeData.created_at,
                updatedAt: sizeData.updated_at
              };
              
              sizes.push(sizeObj);
            }
          } catch (e) {
            console.warn(`Failed to parse size data for input ${index}:`, e.message);
          }
        }
      });
      
      // If sizes found from radio inputs, return them
      if (sizes.length > 0) {
        console.log(`📏 Found ${sizes.length} sizes from radio inputs`);
        
        // Log detailed size information
        console.log('📋 Size Details:');
        sizes.forEach((size, index) => {
          console.log(`  ${index + 1}. Size: ${size.sizeName} | Stock: ${size.stock} | Available: ${size.isAvailable ? 'Yes' : 'No'} | Price: ${size.price || 'N/A'}`);
        });
        
        // Summary of available vs unavailable sizes
        const availableSizes = sizes.filter(s => s.isAvailable);
        const unavailableSizes = sizes.filter(s => !s.isAvailable);
        console.log(`📊 Summary: ${availableSizes.length} available, ${unavailableSizes.length} unavailable`);
        
        return sizes;
      }
      
      // Fallback to common selectors for size options
      const sizeSelectors = [
        '.size-option',
        '.size-selector option',
        '.sizes .size',
        '[class*="size"] option',
        '[class*="size"] .option',
        '.product-options .size',
        '.variant-size option',
        '.size-list .size',
        'select[name*="size"] option',
        '.size-buttons .size'
      ];

      // Try each selector to find sizes
      for (const selector of sizeSelectors) {
        $(selector).each((index, element) => {
          const $element = $(element);
          let sizeName = $element.text().trim();
          
          // Skip empty or placeholder options
          if (!sizeName || sizeName.toLowerCase().includes('seçin') || sizeName.toLowerCase().includes('select')) {
            return;
          }
          
          // Extract size value from option value if text is not useful
          if (!sizeName || sizeName.length < 1) {
            sizeName = $element.attr('value') || $element.attr('data-size');
          }
          
          if (sizeName && sizeName.trim().length > 0) {
            // Check if size is available
            const isDisabled = $element.attr('disabled') || $element.hasClass('disabled') || $element.hasClass('out-of-stock');
            const stockText = $element.attr('data-stock') || $element.find('.stock').text();
            
            let stock = null;
            let isAvailable = !isDisabled;
            
            // Try to extract stock number
            if (stockText) {
              const stockMatch = stockText.match(/\d+/);
              if (stockMatch) {
                stock = parseInt(stockMatch[0]);
                isAvailable = stock > 0;
              }
            }
            
            sizes.push({
              sizeName: sizeName.trim(),
              size: sizeName.trim(),
              isAvailable: isAvailable,
              stock: stock
            });
          }
        });
        
        // If we found sizes with this selector, break to avoid duplicates
        if (sizes.length > 0) {
          break;
        }
      }

      // If no sizes found with specific selectors, look for any size-related text
      if (sizes.length === 0) {
        // Look for size information in text content
        const sizeTexts = [];
        $('*').each((index, element) => {
          const text = $(element).text().trim();
          // Look for common size patterns (numbers, XS, S, M, L, XL, etc.)
          const sizeMatches = text.match(/\b(\d{2,3}|XS|S|M|L|XL|XXL|XXXL)\b/gi);
          if (sizeMatches && text.length < 50) { // Avoid long paragraphs
            sizeMatches.forEach(match => {
              if (!sizeTexts.includes(match.toUpperCase())) {
                sizeTexts.push(match.toUpperCase());
              }
            });
          }
        });
        
        // Convert found size texts to size objects
        sizeTexts.forEach(sizeText => {
          sizes.push({
            sizeName: sizeText,
            size: sizeText,
            isAvailable: true, // Default to available if we can't determine
            stock: null
          });
        });
      }

      console.log(`📏 Found ${sizes.length} sizes for product`);
      return sizes;
      
    } catch (error) {
      console.error('❌ Error scraping product sizes:', error.message);
      return [];
    }
  }

  /**
   * Extract product availability from element
   * @param {Object} $element - Cheerio element
   * @returns {string} Product availability status
   */
  extractProductAvailability($element) {
    // Try multiple approaches to find stock status
    
    // 1. Look for badge-ribbon elements (various selectors)
    const badgeSelectors = [
      '.badge-ribbon span',
      '.badge-ribbon',
      '.badge span',
      '.badge',
      '.ribbon span',
      '.ribbon'
    ];
    
    for (const selector of badgeSelectors) {
      const badgeText = $element.find(selector).first().text().trim().toLowerCase();
      if (badgeText) {
        if (badgeText.includes('stokda') || badgeText.includes('available') || badgeText.includes('mövcud')) {
          return 'in_stock';
        } else if (badgeText.includes('yoxdur') || badgeText.includes('out') || badgeText.includes('bitib') || badgeText.includes('tükendi')) {
          return 'out_of_stock';
        }
      }
    }
    
    // 2. Look for stock status in product card text
    const cardText = $element.text().toLowerCase();
    if (cardText.includes('stokda') || cardText.includes('mövcud')) {
      return 'in_stock';
    } else if (cardText.includes('yoxdur') || cardText.includes('bitib') || cardText.includes('tükendi')) {
      return 'out_of_stock';
    }
    
    // 3. Look for availability indicators in various elements
    const availabilitySelectors = [
      '.availability',
      '.stock',
      '.stock-status',
      '[class*="stock"]',
      '[class*="available"]',
      '[class*="stok"]',
      '.product-status',
      '.status'
    ];
    
    for (const selector of availabilitySelectors) {
      const availabilityText = $element.find(selector).first().text().trim().toLowerCase();
      if (availabilityText) {
        if (availabilityText.includes('stokda') || availabilityText.includes('available') || availabilityText.includes('mövcud')) {
          return 'in_stock';
        } else if (availabilityText.includes('yoxdur') || availabilityText.includes('out') || availabilityText.includes('bitib')) {
          return 'out_of_stock';
        }
      }
    }
    
    // 4. Check if product has sizes available (indicates stock)
    const sizeElements = $element.find('[class*="size"], .variant, .option');
    if (sizeElements.length > 0) {
      // If sizes are present, assume product is available
      return 'in_stock';
    }
    
    // 5. Default to checking if product has a valid price (indicates availability)
    const priceElement = $element.find('.price, [class*="price"], .cost, [class*="cost"]');
    if (priceElement.length > 0 && priceElement.text().trim()) {
      return 'in_stock';
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