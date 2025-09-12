const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

// Disable SSL verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const agent = new https.Agent({
  rejectUnauthorized: false
});

async function scrapeNikeProducts() {
  try {
    console.log('Fetching Nike products page...');
    
    const response = await axios.get('https://www.gosport.az/brand/nike-21', {
      httpsAgent: agent,
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Content length:', response.data.length);
    
    const $ = cheerio.load(response.data);
    
    console.log('\n=== SEARCHING FOR PRODUCT ELEMENTS ===');
    
    // Try different selectors for products
    const productSelectors = [
      '.product-item',
      '.product-card', 
      '.product',
      '[class*="product"]',
      '.card',
      '.item',
      'a[href*="product"]',
      '.col-6',
      '.col-md-4',
      '.col-lg-3'
    ];
    
    productSelectors.forEach(selector => {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`\nFound ${elements.length} elements with selector: ${selector}`);
        elements.each((i, el) => {
          if (i < 3) { // Show first 3
            const text = $(el).text().trim().substring(0, 100);
            const href = $(el).attr('href') || $(el).find('a').attr('href');
            const className = $(el).attr('class');
            console.log(`  ${i+1}. Text: "${text}..." | Href: "${href}" | Class: "${className}"`);
          }
        });
      }
    });
    
    console.log('\n=== SEARCHING FOR SPECIFIC PRODUCT CONTAINERS ===');
    
    // Look for common e-commerce product containers
    const containers = [
      '.row .col',
      '.products .product',
      '.grid .item',
      '[data-product]',
      '.product-list .product',
      '.catalog .item'
    ];
    
    containers.forEach(selector => {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`\nFound ${elements.length} containers with selector: ${selector}`);
      }
    });
    
    console.log('\n=== LOOKING FOR IMAGES ===');
    const images = $('img');
    console.log(`Found ${images.length} images total`);
    
    let productImages = 0;
    images.each((i, img) => {
      const src = $(img).attr('src') || $(img).attr('data-src');
      const alt = $(img).attr('alt') || '';
      if (src && (src.includes('product') || alt.toLowerCase().includes('product'))) {
        productImages++;
        if (productImages <= 3) {
          console.log(`  Product image ${productImages}: ${src} (alt: ${alt})`);
        }
      }
    });
    
    console.log(`\nTotal product-related images: ${productImages}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

scrapeNikeProducts();