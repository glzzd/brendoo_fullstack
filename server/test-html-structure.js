const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

// Disable SSL verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const agent = new https.Agent({
  rejectUnauthorized: false
});

async function testHtmlStructure() {
  try {
    console.log('🧪 Testing HTML structure of Nike brand page...');
    
    const brandUrl = 'https://www.gosport.az/brand/nike-21';
    
    console.log(`\n🔍 Fetching brand page: ${brandUrl}`);
    
    const response = await axios.get(brandUrl, {
      httpsAgent: agent,
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    
    console.log('\n📋 Analyzing HTML structure...');
    
    // Look for product containers
    console.log('\n🔍 Looking for product containers...');
    
    const containerSelectors = [
      '.product',
      '.card',
      '.item',
      '[class*="product"]',
      '.col',
      '[class*="col"]'
    ];
    
    containerSelectors.forEach(selector => {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`\nFound ${elements.length} elements with selector '${selector}'`);
        
        // Show first element's structure
        const firstElement = elements.first();
        const html = firstElement.html();
        if (html && html.length < 1000) {
          console.log('First element HTML:');
          console.log(html.substring(0, 500) + (html.length > 500 ? '...' : ''));
        }
      }
    });
    
    // Look specifically for links that might contain products
    console.log('\n🔍 Looking for product links...');
    
    let linkCount = 0;
    $('a').each((index, element) => {
      if (linkCount >= 3) return; // Only show first 3
      
      const $element = $(element);
      const href = $element.attr('href');
      
      if (href && (href.includes('/product/') || href.includes('nike'))) {
        linkCount++;
        console.log(`\nLink ${linkCount}: ${href}`);
        console.log('Link HTML:');
        const html = $element.html();
        if (html) {
          console.log(html.substring(0, 300) + (html.length > 300 ? '...' : ''));
        }
        console.log('---');
      }
    });
    
    // Look for price elements
    console.log('\n🔍 Looking for price elements...');
    
    const priceSelectors = [
      '.price',
      '.text-primary',
      '[class*="price"]',
      '.cost',
      '.amount',
      'del',
      '.discount'
    ];
    
    priceSelectors.forEach(selector => {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`\nFound ${elements.length} elements with selector '${selector}':`);
        elements.slice(0, 5).each((i, el) => {
          const text = $(el).text().trim();
          const className = $(el).attr('class');
          if (text) {
            console.log(`  ${i + 1}. "${text}" (class: ${className})`);
          }
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testHtmlStructure();