const fs = require('fs');
const path = require('path');

class CacheService {
    constructor() {
        this.cacheDir = path.join(__dirname, '../../cache');
        this.ensureCacheDir();
    }

    ensureCacheDir() {
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
        }
    }

    // Mağaza kategorilerini cache'e kaydet
    saveStoreCategories(storeName, categories) {
        try {
            const fileName = `${storeName}-kategoriler.json`;
            const filePath = path.join(this.cacheDir, fileName);
            
            const cacheData = {
                storeName,
                categories,
                lastUpdated: new Date().toISOString(),
                totalCount: categories.length
            };

            fs.writeFileSync(filePath, JSON.stringify(cacheData, null, 2), 'utf8');
            console.log(`✅ ${storeName} kategorileri cache'e kaydedildi: ${categories.length} kategori`);
            
            return true;
        } catch (error) {
            console.error(`❌ Cache kaydetme hatası (${storeName}):`, error.message);
            return false;
        }
    }

    // Mağaza kategorilerini cache'den oku (10 dakikalık cache süresi kontrolü ile)
    getStoreCategories(storeName) {
        try {
            const fileName = `${storeName}-kategoriler.json`;
            const filePath = path.join(this.cacheDir, fileName);
            
            if (!fs.existsSync(filePath)) {
                console.log(`⚠️ ${storeName} için cache dosyası bulunamadı`);
                return null;
            }

            // Cache yaşını kontrol et (10 dakika = 1/6 saat)
            const ageInHours = this.getCacheAge(storeName);
            const cacheExpiryMinutes = 10;
            const cacheExpiryHours = cacheExpiryMinutes / 60;
            
            if (ageInHours > cacheExpiryHours) {
                console.log(`⏰ ${storeName} cache'i ${Math.round(ageInHours * 60)} dakika eski, süresi dolmuş (${cacheExpiryMinutes} dk limit)`);
                // Cache süresi dolmuş, dosyayı sil
                this.clearStoreCache(storeName);
                return null;
            }

            const cacheData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            console.log(`📖 ${storeName} kategorileri cache'den okundu: ${cacheData.totalCount} kategori (${Math.round(ageInHours * 60)} dk eski)`);
            
            return cacheData;
        } catch (error) {
            console.error(`❌ Cache okuma hatası (${storeName}):`, error.message);
            return null;
        }
    }

    // Cache dosyasını sil
    clearStoreCache(storeName) {
        try {
            const fileName = `${storeName}-kategoriler.json`;
            const filePath = path.join(this.cacheDir, fileName);
            
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ ${storeName} cache'i temizlendi`);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error(`❌ Cache temizleme hatası (${storeName}):`, error.message);
            return false;
        }
    }

    // Tüm cache dosyalarını listele
    listCacheFiles() {
        try {
            const files = fs.readdirSync(this.cacheDir)
                .filter(file => file.endsWith('-kategoriler.json'))
                .map(file => {
                    const filePath = path.join(this.cacheDir, file);
                    const stats = fs.statSync(filePath);
                    const storeName = file.replace('-kategoriler.json', '');
                    
                    return {
                        storeName,
                        fileName: file,
                        lastModified: stats.mtime,
                        size: stats.size
                    };
                });
            
            return files;
        } catch (error) {
            console.error('❌ Cache dosyaları listeleme hatası:', error.message);
            return [];
        }
    }

    // Cache dosyasının yaşını kontrol et (saat cinsinden)
    getCacheAge(storeName) {
        try {
            const fileName = `${storeName}-kategoriler.json`;
            const filePath = path.join(this.cacheDir, fileName);
            
            if (!fs.existsSync(filePath)) {
                return null;
            }

            const stats = fs.statSync(filePath);
            const ageInHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
            
            return ageInHours;
        } catch (error) {
            console.error(`❌ Cache yaş kontrolü hatası (${storeName}):`, error.message);
            return null;
        }
    }
}

module.exports = CacheService;