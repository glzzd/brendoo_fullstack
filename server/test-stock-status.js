const ProductScraper = require('./src/scrapers/gosport-scraper/productScraper');

async function testStockStatus() {
  try {
    console.log('🧪 Testing stock status extraction from badge-ribbon...');
    
    const scraper = new ProductScraper();
    
    // Test with Nike brand page to check stock status
    const brandUrl = 'https://www.gosport.az/brand/nike-21';
    const brandName = 'Nike';
    
    console.log(`\n🔍 Scraping first page of ${brandName} products...`);
    
    const products = await scraper.scrapeProductsFromPage(brandUrl, brandName, 1);
    
    console.log(`\n📊 Found ${products.length} products`);
    
    // Show stock status for first 10 products
    console.log('\n📋 Stock Status Details:');
    products.slice(0, 10).forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Stock Status: ${product.availability}`);
      console.log(`   Price: ${product.price} ${product.currency}`);
      console.log(`   URL: ${product.url}`);
      console.log('   ---');
    });
    
    // Count stock statuses
    const stockCounts = products.reduce((acc, product) => {
      acc[product.availability] = (acc[product.availability] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📈 Stock Status Summary:');
    Object.entries(stockCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} products`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testStockStatus();