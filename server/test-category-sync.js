const mongoose = require('mongoose');
const CacheService = require('./src/services/cacheService');
const Category = require('./src/models/Category');
const Store = require('./src/models/Store');
require('dotenv').config();

async function testCategorySync() {
  try {
    console.log('🧪 Kategori senkronizasyonu testi başlıyor...');
    
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB bağlantısı kuruldu');
    
    // Test store ID'si (gosport)
    const storeId = '68c55b69a73441035a2151cc';
    
    // Store'u kontrol et
    const store = await Store.findById(storeId);
    if (!store) {
      console.log('❌ Store bulunamadı, test durduruluyor');
      return;
    }
    console.log(`✅ Store bulundu: ${store.name}`);
    
    // Cache service'i başlat
    const cacheService = new CacheService();
    const storeName = 'gosport';
    
    console.log('\n📖 Cache\'den kategoriler okunuyor...');
    let cachedData = cacheService.getStoreCategories(storeName);
    let scrapedBrands = [];
    
    if (cachedData && cachedData.categories) {
      console.log(`✅ Cache\'den ${cachedData.categories.length} kategori bulundu`);
      // Cache'deki veriyi scraper formatına çevir
      scrapedBrands = cachedData.categories.map(cat => ({
        name: cat.name,
        url: cat.url,
        id: cat.url.split('-').pop(), // URL'den ID çıkar
        slug: cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        scrapedAt: new Date(cat.scrapedAt)
      }));
    } else {
      console.log('❌ Cache\'de veri bulunamadı');
      return;
    }
    
    console.log('📊 Kullanılacak kategori detayları:');
    scrapedBrands.slice(0, 5).forEach((brand, index) => {
      console.log(`${index + 1}. ${brand.name} (${brand.url})`);
    });
    
    // Mevcut kategorileri al
    const existingCategories = await Category.find({ store: storeId });
    const existingCategoryNames = existingCategories.map(cat => cat.name.toLowerCase());
    const existingCategorySlugs = existingCategories.map(cat => cat.slug);
    
    console.log(`\n📋 Mevcut kategoriler: ${existingCategories.length}`);
    
    // Eklenecek kategorileri hazırla
    const categoriesToAdd = [];
    const existingCategoriesFound = [];
    
    for (const brand of scrapedBrands) {
      const categoryName = brand.name;
      const categorySlug = brand.slug || categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      // Kategori zaten var mı kontrol et
      if (!existingCategoryNames.includes(categoryName.toLowerCase()) && !existingCategorySlugs.includes(categorySlug)) {
        categoriesToAdd.push({
          name: categoryName,
          slug: categorySlug,
          store: storeId,
          level: 1, // Top level categories
          isActive: true,
          externalId: brand.id,
          externalUrl: brand.url,
          imageUrl: null,
          sortOrder: categoriesToAdd.length + 1
        });
      } else {
        existingCategoriesFound.push(categoryName);
      }
    }
    
    console.log(`\n📝 Eklenecek yeni kategoriler: ${categoriesToAdd.length}`);
    console.log(`🔄 Zaten mevcut kategoriler: ${existingCategoriesFound.length}`);
    
    // Bulk insert new categories
    let addedCategories = [];
    if (categoriesToAdd.length > 0) {
      console.log(`\n💾 ${categoriesToAdd.length} yeni kategori ekleniyor...`);
      addedCategories = await Category.insertMany(categoriesToAdd);
      console.log(`✅ ${addedCategories.length} kategori başarıyla eklendi`);
    } else {
      console.log('\n✅ Eklenecek yeni kategori yok, tüm kategoriler zaten mevcut');
    }
    
    console.log(`\n🎉 Sync tamamlandı: ${addedCategories.length} eklendi, ${existingCategoriesFound.length} mevcut`);
    
    // MongoDB bağlantısını kapat
    await mongoose.connection.close();
    console.log('✅ MongoDB bağlantısı kapatıldı');
    
  } catch (error) {
    console.error('❌ Test hatası:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

testCategorySync();