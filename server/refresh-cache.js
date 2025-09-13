const brandScraperService = require('./src/services/brandScraperService');

async function refreshCache() {
  try {
    console.log('🔄 Cache yenileniyor...');
    
    console.log('🔍 Brand scraping başlıyor...');
    const brands = await brandScraperService.scrapeAllBrands();
    
    console.log(`✅ ${brands.length} brand scrape edildi ve cache'e kaydedildi`);
    
  } catch (error) {
    console.error('❌ Cache yenileme hatası:', error.message);
  }
}

refreshCache();