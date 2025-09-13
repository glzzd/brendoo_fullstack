const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

// Disable SSL verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const agent = new https.Agent({
  rejectUnauthorized: false
});

async function testBadgeRibbon() {
  try {
    console.log('🧪 Testing badge-ribbon extraction...');
    
    // Test with Nike brand page first
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
    
    console.log('\n📋 Looking for product links and badge-ribbon elements...');
    
    let productCount = 0;
    $('a').each((index, element) => {
      if (productCount >= 5) return; // Only check first 5 products
      
      const $element = $(element);
      const productUrl = $element.attr('href');
      
      // Only check product links
      if (productUrl && productUrl.includes('/product/')) {
        const productName = $element.find('h5, .card-title, .product-name').first().text().trim() || 
                           $element.text().trim().substring(0, 50);
      
        if (productName) {
          productCount++;
          console.log(`\n${productCount}. Product: ${productName}`);
          console.log(`   URL: ${productUrl}`);
          
          // Look for badge-ribbon
          const badgeRibbon = $element.find('.badge-ribbon');
          console.log(`   Badge-ribbon elements found: ${badgeRibbon.length}`);
          
          badgeRibbon.each((i, badge) => {
            const $badge = $(badge);
            const badgeText = $badge.text().trim();
            const badgeClass = $badge.attr('class');
            console.log(`     Badge ${i + 1}: "${badgeText}" (class: ${badgeClass})`);
            
            // Check for span inside
            const spanText = $badge.find('span').text().trim();
            if (spanText) {
              console.log(`     Span text: "${spanText}"`);
            }
          });
          
          // Look for other stock indicators
          const stockElements = $element.find('[class*="stock"], [class*="available"], .availability');
          if (stockElements.length > 0) {
            console.log(`   Other stock elements found: ${stockElements.length}`);
            stockElements.each((i, el) => {
              const text = $(el).text().trim();
              const className = $(el).attr('class');
              console.log(`     Stock element ${i + 1}: "${text}" (class: ${className})`);
            });
          }
          
          console.log('   ---');
        }
      }
    });
    
    if (productCount === 0) {
      console.log('❌ No products found with the selector a[href*="/product/"]');
      
      // Try alternative selectors
      console.log('\n🔍 Trying alternative selectors...');
      const alternativeSelectors = ['.product', '.card', '.item', '[class*="product"]'];
      
      alternativeSelectors.forEach(selector => {
        const elements = $(selector);
        if (elements.length > 0) {
          console.log(`Found ${elements.length} elements with selector: ${selector}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testBadgeRibbon();