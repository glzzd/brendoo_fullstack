const goSportScraper = require('./src/scrapers/gosport-scraper');

async function testScraper() {
  try {
    console.log('Testing GoSport scraper with brand products...');
    
    // Test with a brand URL to get products with sizes
    const brandUrl = 'https://www.gosport.az/brand/adidas-20';
    const brandName = 'ADIDAS';
    
    console.log(`Getting products from: ${brandUrl}`);
    
    const products = await goSportScraper.getProductsByBrand(brandUrl, brandName);
    
    console.log(`\n=== FOUND ${products.length} PRODUCTS ===`);
    
    // Show first few products with their sizes
    for (let i = 0; i < Math.min(3, products.length); i++) {
      const product = products[i];
      console.log(`\n${i + 1}. ${product.name}`);
      console.log(`   Price: ${product.price}`);
      console.log(`   Original Price: ${product.originalPrice}`);
      console.log(`   Discounted: ${product.isDiscounted}`);
      console.log(`   URL: ${product.url}`);
      
      if (product.sizes && product.sizes.length > 0) {
        console.log(`   Sizes (${product.sizes.length}):`);
        product.sizes.forEach((size, sizeIndex) => {
          console.log(`     ${sizeIndex + 1}. ${size.sizeName} - Available: ${size.isAvailable}, Stock: ${size.stock}, Price: ${size.price}`);
        });
      } else {
        console.log('   No sizes found');
      }
    }
    

    
  } catch (error) {
    console.error('Error testing scraper:', error.message);
  }
}

testScraper();