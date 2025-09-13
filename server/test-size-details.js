const ProductScraper = require('./src/scrapers/gosport-scraper/productScraper');

async function testSizeDetails() {
  try {
    const productScraper = new ProductScraper();
    
    // Test with a specific product URL
    const productUrl = 'https://www.gosport.az/product/vans-knu-skool-kisi-krossovkasi-4988';
    
    console.log('🔍 Testing size scraping for single product...');
    console.log(`📄 Product URL: ${productUrl}`);
    console.log('\n' + '='.repeat(60) + '\n');
    
    const sizes = await productScraper.scrapeProductSizes(productUrl);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL RESULTS:');
    console.log(`Total sizes found: ${sizes.length}`);
    
    if (sizes.length > 0) {
      console.log('\n📋 Complete Size Array:');
      console.log(JSON.stringify(sizes, null, 2));
      
      console.log('\n📈 Available Sizes:');
      const availableSizes = sizes.filter(s => s.isAvailable);
      availableSizes.forEach(size => {
        console.log(`  ✅ ${size.sizeName} (Stock: ${size.stock})`);
      });
      
      console.log('\n📉 Unavailable Sizes:');
      const unavailableSizes = sizes.filter(s => !s.isAvailable);
      unavailableSizes.forEach(size => {
        console.log(`  ❌ ${size.sizeName} (Stock: ${size.stock})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSizeDetails();