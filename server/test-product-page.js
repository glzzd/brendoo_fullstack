const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

// Disable SSL verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const agent = new https.Agent({
  rejectUnauthorized: false
});

async function testProductPage() {
  try {
    console.log('🧪 Testing individual product page for stock status...');
    
    // Test with a specific product page
    const productUrl = 'https://www.gosport.az/product/nike-u-nsw-everyday-essential-ns-3829';
    
    console.log(`\n🔍 Fetching product page: ${productUrl}`);
    
    const response = await axios.get(productUrl, {
      httpsAgent: agent,
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    console.log('\n📋 Looking for stock/availability indicators...');
    
    // Look for badge-ribbon elements
    const badgeRibbons = $('.badge-ribbon');
    console.log(`\nBadge-ribbon elements found: ${badgeRibbons.length}`);
    
    badgeRibbons.each((i, element) => {
      const $element = $(element);
      const text = $element.text().trim();
      const className = $element.attr('class');
      console.log(`  Badge ${i + 1}: "${text}" (class: ${className})`);
      
      // Check for span inside
      const spanText = $element.find('span').text().trim();
      if (spanText) {
        console.log(`    Span text: "${spanText}"`);
      }
    });
    
    // Look for other stock-related elements
    console.log('\n🔍 Looking for other stock indicators...');
    
    const stockSelectors = [
      '.stock',
      '.availability',
      '[class*="stock"]',
      '[class*="available"]',
      '[class*="stok"]',
      '.badge',
      '.label',
      '.status'
    ];
    
    stockSelectors.forEach(selector => {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`\nFound ${elements.length} elements with selector '${selector}':`);
        elements.each((i, el) => {
          const text = $(el).text().trim();
          const className = $(el).attr('class');
          if (text) {
            console.log(`  ${i + 1}. "${text}" (class: ${className})`);
          }
        });
      }
    });
    
    // Look for any element containing stock-related text
    console.log('\n🔍 Searching for stock-related text in all elements...');
    
    const stockKeywords = ['stok', 'stock', 'available', 'mövcud', 'yoxdur', 'bitib', 'out'];
    let foundStockText = false;
    
    $('*').each((i, element) => {
      const $element = $(element);
      const text = $element.text().trim().toLowerCase();
      
      stockKeywords.forEach(keyword => {
        if (text.includes(keyword) && text.length < 100) { // Avoid very long texts
          if (!foundStockText) {
            console.log('\nFound elements with stock-related text:');
            foundStockText = true;
          }
          const className = $element.attr('class') || 'no-class';
          const tagName = $element.prop('tagName').toLowerCase();
          console.log(`  <${tagName} class="${className}">: "${$element.text().trim()}"`);
        }
      });
    });
    
    if (!foundStockText) {
      console.log('No stock-related text found on the page.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testProductPage();