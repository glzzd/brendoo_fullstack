const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

// Disable SSL verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const agent = new https.Agent({
  rejectUnauthorized: false
});

async function scrapeBrands() {
  try {
    console.log('Fetching GoSport brands page...');
    
    const response = await axios.get('https://www.gosport.az/brands', {
      httpsAgent: agent,
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Content length:', response.data.length);
    
    const $ = cheerio.load(response.data);
    
    console.log('\n=== SEARCHING FOR BRAND ELEMENTS ===');
    
    // Try different selectors for brands
    const brandSelectors = [
      '.brand-item',
      '.brand-card', 
      '.brand',
      '[class*="brand"]',
      '.card',
      '.item',
      'a[href*="brand"]'
    ];
    
    brandSelectors.forEach(selector => {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`\nFound ${elements.length} elements with selector: ${selector}`);
        elements.each((i, el) => {
          if (i < 5) { // Show first 5
            const text = $(el).text().trim();
            const href = $(el).attr('href') || $(el).find('a').attr('href');
            const className = $(el).attr('class');
            console.log(`  ${i+1}. Text: "${text}" | Href: "${href}" | Class: "${className}"`);
          }
        });
      }
    });
    
    console.log('\n=== SEARCHING FOR PAGINATION ELEMENTS ===');
    
    const paginationSelectors = [
      '.pagination',
      '.page-numbers',
      '.page-nav',
      '[class*="page"]',
      '[class*="pagination"]',
      'nav'
    ];
    
    paginationSelectors.forEach(selector => {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`\nFound ${elements.length} elements with selector: ${selector}`);
        elements.each((i, el) => {
          if (i < 3) { // Show first 3
            const text = $(el).text().trim();
            const className = $(el).attr('class');
            console.log(`  ${i+1}. Text: "${text}" | Class: "${className}"`);
          }
        });
      }
    });
    
    // Also check for any links containing 'brand'
    console.log('\n=== BRAND LINKS ===');
    $('a[href*="brand"]').each((i, el) => {
      if (i < 10) {
        const text = $(el).text().trim();
        const href = $(el).attr('href');
        console.log(`  ${i+1}. "${text}" -> ${href}`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

scrapeBrands();