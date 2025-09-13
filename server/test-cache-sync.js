const axios = require('axios');
const CacheService = require('./src/services/cacheService');

async function testCacheSync() {
  try {
    console.log('🧪 Cache ve kategori senkronizasyonu testi başlıyor...');
    
    // Cache service'i test et
    const cacheService = new CacheService();
    const storeName = 'gosport';
    
    console.log('\n📖 Cache\'den veri okuma testi:');
    const cachedData = cacheService.getStoreCategories(storeName);
    
    if (cachedData && cachedData.categories) {
      console.log(`✅ Cache\'den ${cachedData.categories.length} kategori bulundu`);
      console.log('📋 İlk 5 kategori:');
      cachedData.categories.slice(0, 5).forEach((cat, index) => {
        console.log(`  ${index + 1}. ${cat.name} (${cat.url})`);
      });
      
      // Cache'deki veriyi scraper formatına çevir
      const scrapedBrands = cachedData.categories.map(cat => ({
        name: cat.name,
        url: cat.url,
        id: cat.url.split('-').pop(), // URL'den ID çıkar
        slug: cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        scrapedAt: new Date(cat.scrapedAt)
      }));
      
      console.log(`\n🔄 Scraper formatına çevrildi: ${scrapedBrands.length} brand`);
      console.log('📋 İlk 3 brand (scraper formatı):');
      scrapedBrands.slice(0, 3).forEach((brand, index) => {
        console.log(`  ${index + 1}. ${brand.name} - ID: ${brand.id} - Slug: ${brand.slug}`);
      });
      
    } else {
      console.log('❌ Cache\'de veri bulunamadı');
    }
    
    console.log('\n✅ Test tamamlandı!');
    
  } catch (error) {
    console.error('❌ Test hatası:', error.message);
  }
}

testCacheSync();