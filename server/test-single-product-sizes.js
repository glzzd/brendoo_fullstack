const ProductScraper = require('./src/scrapers/gosport-scraper/productScraper');

async function testSingleProduct() {
  try {
    const productScraper = new ProductScraper();
    
    // First get a working product URL from brand page
    console.log('Getting products from ADIDAS brand page...');
    const products = await productScraper.scrapeProducts('https://www.gosport.az/brand/adidas-20', 'ADIDAS', 1, 1);
    
    if (products.length === 0) {
      console.log('No products found!');
      return;
    }
    
    const firstProduct = products[0];
    const productUrl = firstProduct.url;
    
    console.log(`Found product: ${firstProduct.name}`);
    console.log(`Testing with sizes from: ${productUrl}`);
    
    // The product should already have sizes from scrapeProducts
    if (firstProduct.sizes && firstProduct.sizes.length > 0) {
      console.log(`\n=== SIZES FROM SCRAPE PRODUCTS (${firstProduct.sizes.length}) ===`);
      firstProduct.sizes.forEach((size, index) => {
        console.log(`${index + 1}. ${size.sizeName} - Available: ${size.isAvailable}, Stock: ${size.stock}, Price: ${size.price}`);
      });
    }
    
    console.log('\n=== NOW TESTING DIRECT SIZE SCRAPING ===');
    
    console.log('Testing single product size scraping...');
    console.log(`URL: ${productUrl}`);
    
    const sizes = await productScraper.scrapeProductSizes(productUrl);
    
    console.log(`\n=== FOUND ${sizes.length} SIZES ===`);
    
    sizes.forEach((size, index) => {
      console.log(`\n${index + 1}. Size: ${size.sizeName}`);
      console.log(`   Size ID: ${size.sizeId}`);
      console.log(`   Product ID: ${size.productId}`);
      console.log(`   Available: ${size.isAvailable}`);
      console.log(`   Stock: ${size.stock}`);
      console.log(`   Price: ${size.price}`);
      console.log(`   Discounted Price: ${size.discountedPrice}`);
      console.log(`   Barcode: ${size.barcode}`);
    });
    
  } catch (error) {
    console.error('Error testing single product:', error.message);
  }
}

testSingleProduct();