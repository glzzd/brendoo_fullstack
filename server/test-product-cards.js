const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

// Disable SSL verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const agent = new https.Agent({
  rejectUnauthorized: false
});

async function testProductCards() {
  try {
    console.log('🧪 Testing product card structure...');
    
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
    
    console.log('\n📋 Analyzing product cards...');
    
    // Find product links
    const productLinks = [];
    $('a').each((index, element) => {
      const $element = $(element);
      const href = $element.attr('href');
      
      if (href && href.includes('/product/')) {
        productLinks.push({
          url: href,
          element: $element
        });
      }
    });
    
    console.log(`\nFound ${productLinks.length} product links`);
    
    // Analyze first 3 product cards
    for (let i = 0; i < Math.min(3, productLinks.length); i++) {
      const link = productLinks[i];
      console.log(`\n=== PRODUCT CARD ${i + 1} ===`);
      console.log(`URL: ${link.url}`);
      
      // Get the parent container that likely contains the full product card
      let $card = link.element;
      
      // Try to find the actual product card container
      const possibleContainers = [
        $card.closest('.col'),
        $card.closest('[class*="col"]'),
        $card.closest('.card'),
        $card.closest('.product'),
        $card.closest('[class*="product"]'),
        $card.parent(),
        $card.parent().parent()
      ];
      
      for (const container of possibleContainers) {
        if (container.length > 0) {
          const containerHtml = container.html();
          if (containerHtml && containerHtml.includes('AZN')) {
            $card = container;
            break;
          }
        }
      }
      
      console.log('\n📦 Card HTML structure:');
      const cardHtml = $card.html();
      if (cardHtml) {
        // Show relevant parts of the HTML
        const lines = cardHtml.split('\n');
        const relevantLines = lines.filter(line => 
          line.includes('AZN') || 
          line.includes('price') || 
          line.includes('del') || 
          line.includes('text-primary') ||
          line.includes('product-price') ||
          line.includes('fs-') ||
          line.includes('fw-')
        );
        
        if (relevantLines.length > 0) {
          console.log('Price-related HTML lines:');
          relevantLines.forEach((line, idx) => {
            if (idx < 10) { // Limit output
              console.log(`  ${line.trim()}`);
            }
          });
        } else {
          console.log('No price-related content found in card HTML');
          console.log('First 500 chars of card HTML:');
          console.log(cardHtml.substring(0, 500));
        }
      }
      
      // Test price extraction on this card
      console.log('\n💰 Testing price extraction:');
      
      // Try different selectors
      const priceSelectors = [
        '.product-price',
        '.text-primary',
        '.price',
        '[class*="price"]',
        '.fs-5',
        '.fw-bold',
        'del'
      ];
      
      priceSelectors.forEach(selector => {
        const elements = $card.find(selector);
        if (elements.length > 0) {
          console.log(`  ${selector}: found ${elements.length} elements`);
          elements.each((idx, el) => {
            if (idx < 3) {
              const text = $(el).text().trim();
              const className = $(el).attr('class');
              console.log(`    ${idx + 1}. "${text}" (class: ${className})`);
            }
          });
        }
      });
      
      // Try to extract AZN from all text
      const allText = $card.text();
      const aznMatches = allText.match(/([0-9]+(?:\.[0-9]+)?)\s*AZN/gi);
      if (aznMatches) {
        console.log(`  AZN matches in text: ${aznMatches.join(', ')}`);
      }
      
      console.log('\n' + '='.repeat(50));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testProductCards();