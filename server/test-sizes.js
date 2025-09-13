const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

// Disable SSL verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const agent = new https.Agent({
  rejectUnauthorized: false
});

async function testProductSizes() {
  try {
    // First get product links from main page
    console.log('Getting product links from main page...');
    
    const mainResponse = await axios.get('https://www.gosport.az/', {
      httpsAgent: agent,
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const $main = cheerio.load(mainResponse.data);
    const productLinks = [];
    
    $main('a[href*="/product/"]').each((i, el) => {
      const href = $main(el).attr('href');
      if (href && !productLinks.includes(href) && productLinks.length < 5) {
        productLinks.push(href.startsWith('http') ? href : `https://www.gosport.az${href}`);
      }
    });
    
    console.log('Found product links:', productLinks);
    
    if (productLinks.length === 0) {
      console.log('No product links found!');
      return;
    }
    
    const productUrl = productLinks[0];
    console.log(`\nTesting product sizes from: ${productUrl}`);
    
    const response = await axios.get(productUrl, {
      httpsAgent: agent,
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
    
    console.log('\n=== SEARCHING FOR SIZE ELEMENTS ===');
    
    // Look for nav-thumbs structure
    console.log('\n1. Checking nav-thumbs structure:');
    const navThumbs = $('.nav-thumbs.nav.mb-3');
    console.log(`Found nav-thumbs elements: ${navThumbs.length}`);
    
    if (navThumbs.length > 0) {
      navThumbs.each((i, navElement) => {
        console.log(`\nNav-thumbs ${i + 1}:`);
        const $nav = $(navElement);
        console.log(`HTML: ${$nav.html().substring(0, 500)}...`);
        
        const radioElements = $nav.find('.form-check.radio-text.form-check-inline');
        console.log(`Found radio elements: ${radioElements.length}`);
        
        radioElements.each((j, radioEl) => {
          const $radio = $(radioEl);
          const $input = $radio.find('input[type="radio"]');
          const $label = $radio.find('label.radio-text-label');
          
          console.log(`\nRadio ${j + 1}:`);
          console.log(`Input value: ${$input.attr('value')}`);
          console.log(`Label text: ${$label.text().trim()}`);
          console.log(`Input disabled: ${$input.attr('disabled')}`);
        });
      });
    }
    
    // Look for other size-related elements
    console.log('\n2. Checking other size selectors:');
    const sizeSelectors = [
      '.product-attribute',
      '.size-option',
      '.size-selector',
      '.sizes',
      '[class*="size"]',
      'input[type="radio"]',
      '.form-check',
      '.radio-text'
    ];
    
    sizeSelectors.forEach(selector => {
      const elements = $(selector);
      if (elements.length > 0) {
        console.log(`\nFound ${elements.length} elements with selector: ${selector}`);
        elements.each((i, el) => {
          if (i < 3) { // Show first 3
            const $el = $(el);
            const text = $el.text().trim().substring(0, 100);
            const className = $el.attr('class');
            const value = $el.attr('value');
            console.log(`  ${i + 1}. Text: "${text}" | Class: "${className}" | Value: "${value}"`);
          }
        });
      }
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testProductSizes();