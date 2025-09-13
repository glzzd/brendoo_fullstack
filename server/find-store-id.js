const mongoose = require('mongoose');
const Store = require('./src/models/Store');
require('dotenv').config();

async function findStoreId() {
  try {
    console.log('🔍 Store ID\'si aranıyor...');
    
    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB bağlantısı kuruldu');
    
    // Tüm store'ları listele
    const stores = await Store.find({});
    console.log(`\n📋 Bulunan store'lar: ${stores.length}`);
    
    stores.forEach((store, index) => {
      console.log(`${index + 1}. ${store.name} - ID: ${store._id} - URL: ${store.url}`);
    });
    
    // GoSport store'unu ara
    const gosportStore = stores.find(store => 
      store.name.toLowerCase().includes('gosport') || 
      store.url.includes('gosport')
    );
    
    if (gosportStore) {
      console.log(`\n✅ GoSport store bulundu:`);
      console.log(`   ID: ${gosportStore._id}`);
      console.log(`   Name: ${gosportStore.name}`);
      console.log(`   URL: ${gosportStore.url}`);
    } else {
      console.log('\n❌ GoSport store bulunamadı');
    }
    
    // MongoDB bağlantısını kapat
    await mongoose.connection.close();
    console.log('\n✅ MongoDB bağlantısı kapatıldı');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
  }
}

findStoreId();