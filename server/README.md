# Backend API Boilerplate

Node.js, Express.js, MongoDB ve JWT kullanarak geliştirilmiş modern backend API boilerplate projesi.

## 🚀 Özellikler

- **Node.js & Express.js** - Hızlı ve esnek web framework
- **MongoDB & Mongoose** - NoSQL veritabanı ve ODM
- **JWT Authentication** - Güvenli kimlik doğrulama
- **Bcrypt** - Şifre hashleme
- **Express Validator** - Veri doğrulama
- **Helmet** - Güvenlik middleware'i
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API rate limiting
- **Error Handling** - Merkezi hata yönetimi
- **Service Layer Architecture** - Temiz kod mimarisi

## 📁 Proje Yapısı

```
src/
├── config/
│   └── database.js          # MongoDB bağlantı konfigürasyonu
├── controllers/
│   ├── authController.js    # Authentication controller
│   └── userController.js    # User management controller
├── middleware/
│   ├── auth.js             # JWT authentication middleware
│   ├── errorHandler.js     # Error handling middleware
│   └── validation.js       # Validation middleware
├── models/
│   └── User.js             # User model
├── routes/
│   ├── authRoutes.js       # Authentication routes
│   └── userRoutes.js       # User management routes
├── services/
│   ├── authService.js      # Authentication business logic
│   └── userService.js      # User management business logic
└── utils/
    ├── asyncHandler.js     # Async error handler
    └── response.js         # Response utilities
```

## 🛠️ Kurulum

1. **Projeyi klonlayın:**
```bash
git clone <repository-url>
cd backend-api-boilerplate
```

2. **Bağımlılıkları yükleyin:**
```bash
npm install
```

3. **Environment variables'ları ayarlayın:**
`.env` dosyasını düzenleyin:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/backend-api-boilerplate
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
BCRYPT_SALT_ROUNDS=12
```

4. **MongoDB'yi başlatın:**
```bash
# MongoDB'nin sisteminizde kurulu olduğundan emin olun
mongod
```

5. **Uygulamayı başlatın:**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📚 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| POST | `/register` | Kullanıcı kaydı | ❌ |
| POST | `/login` | Kullanıcı girişi | ❌ |
| GET | `/me` | Mevcut kullanıcı bilgileri | ✅ |
| PUT | `/updatedetails` | Kullanıcı bilgilerini güncelle | ✅ |
| PUT | `/updatepassword` | Şifre güncelle | ✅ |
| GET | `/logout` | Çıkış yap | ✅ |

### User Management Routes (`/api/users`) - Admin Only

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/` | Tüm kullanıcıları listele | ✅ Admin |
| GET | `/stats` | Kullanıcı istatistikleri | ✅ Admin |
| GET | `/:id` | Kullanıcı detayları | ✅ Admin |
| PUT | `/:id` | Kullanıcı güncelle | ✅ Admin |
| DELETE | `/:id` | Kullanıcı sil | ✅ Admin |
| PATCH | `/:id/toggle-status` | Kullanıcı durumunu değiştir | ✅ Admin |

### Health Check

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/api/health` | Sunucu durumu | ❌ |

## 🔐 Authentication

API, JWT (JSON Web Token) tabanlı authentication kullanır.

### Token Kullanımı
```javascript
// Headers
Authorization: Bearer <your-jwt-token>
```

### Örnek Register Request
```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123"
}
```

### Örnek Login Request
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "Password123"
}
```

## 🛡️ Güvenlik

- **Helmet**: HTTP headers güvenliği
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: IP başına istek sınırlaması (15 dakikada 100 istek)
- **Password Hashing**: Bcrypt ile güvenli şifre hashleme
- **JWT**: Güvenli token tabanlı authentication
- **Input Validation**: Express-validator ile veri doğrulama

## 🔧 Geliştirme

### Scripts
```bash
npm start          # Production mode
npm run dev        # Development mode (nodemon)
npm test           # Test çalıştır
```

### Environment Variables
- `PORT`: Sunucu portu (varsayılan: 5000)
- `NODE_ENV`: Ortam (development/production)
- `MONGODB_URI`: MongoDB bağlantı string'i
- `JWT_SECRET`: JWT secret key
- `JWT_EXPIRE`: JWT token süresi
- `BCRYPT_SALT_ROUNDS`: Bcrypt salt rounds

## 📝 Kullanım Örnekleri

### Postman Collection
API'yi test etmek için Postman collection'ı oluşturabilirsiniz:

1. Base URL: `http://localhost:5000/api`
2. Authentication header'ı ekleyin
3. Endpoint'leri test edin

### cURL Örnekleri

```bash
# Kullanıcı kaydı
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"Password123"}'

# Kullanıcı girişi
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Password123"}'

# Profil bilgileri (token gerekli)
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'i push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🆘 Destek

Sorularınız için issue açabilir veya iletişime geçebilirsiniz.

---

**Not**: Production ortamında `.env` dosyasındaki değerleri güvenli değerlerle değiştirmeyi unutmayın!