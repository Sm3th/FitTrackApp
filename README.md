# 🏋️ FitTrack Pro - Complete Project
## Full-Stack Fitness Tracking Platform

**Ready to Run!** Sadece indir, `npm install` ve başlat! 🚀

---

## 📦 İçerikler

```
fittrack-complete/
├── backend/                 # Node.js + Express + TypeScript + Prisma
│   ├── src/
│   │   ├── routes/         # API endpoints (auth, exercise, workout)
│   │   ├── services/       # Business logic (auth, prisma)
│   │   ├── middleware/     # Auth middleware
│   │   ├── types/          # TypeScript definitions
│   │   └── server.ts       # Entry point
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema (SQLite)
│   │   └── seed.ts         # Sample data
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                # Environment variables (hazır!)
│   └── .gitignore
│
└── web/                     # React + TypeScript + Tailwind CSS
    ├── src/
    │   ├── pages/          # HomePage, LoginPage, RegisterPage
    │   ├── components/     # ExerciseList
    │   ├── services/       # API client (axios)
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── tsconfig.json
    └── index.html
```

---

## ⚡ HIZLI BAŞLANGIÇ (5 Dakika!)

### Adım 1: Backend Kurulum (2 dakika)

```bash
# Backend klasörüne git
cd backend

# Paketleri kur
npm install

# Prisma setup
npx prisma generate
npx prisma migrate dev --name init
npm run prisma:seed

# Server başlat
npm run dev
```

**Göreceksin:**
```
🚀 FitTrack Pro Backend Server
📡 Server running on port 3000
```

### Adım 2: Frontend Kurulum (2 dakika)

```bash
# YENİ terminal aç
cd web

# Paketleri kur
npm install

# Dev server başlat
npm run dev
```

**Göreceksin:**
```
  VITE v5.0.8  ready in 523 ms

  ➜  Local:   http://localhost:5173/
```

### Adım 3: Test Et! (1 dakika)

**Tarayıcıda aç:**
```
http://localhost:5173
```

**Demo User ile Login:**
```
Email: demo@fittrack.com
Password: demo123456
```

**✅ ÇALIŞIYOR!** 🎉

---

## 🎯 Özellikler

### ✅ Tamamlanmış:

**Backend:**
- ✅ RESTful API (8 endpoint)
- ✅ JWT Authentication
- ✅ SQLite Database (Prisma ORM)
- ✅ Password Hashing (bcrypt)
- ✅ TypeScript
- ✅ Error Handling

**Frontend:**
- ✅ React 18 + TypeScript
- ✅ Tailwind CSS
- ✅ React Router
- ✅ Axios HTTP Client
- ✅ Responsive Design
- ✅ Authentication Flow
- ✅ Exercise Library
- ✅ Filtering System

**Database:**
- ✅ 8 Tables (Users, Exercises, Workouts, etc.)
- ✅ 10 Sample Exercises
- ✅ 1 Demo User
- ✅ Sample Workout
- ✅ Nutrition Logs
- ✅ Body Metrics
- ✅ Goals

---

## 📊 Database Schema

```
┌─────────────────────────────────────┐
│         FITTRACK DATABASE            │
│           (SQLite)                   │
└─────────────────────────────────────┘

Tables (8):
├── users            → Kullanıcılar
├── user_profiles    → Profil bilgileri
├── exercises        → Egzersiz kütüphanesi (10 adet)
├── workout_sessions → Antrenman oturumları
├── exercise_sets    → Set detayları
├── nutrition_logs   → Beslenme kayıtları
├── body_metrics     → Vücut ölçümleri
└── goals            → Hedefler
```

---

## 🛠️ Kullanılabilir Komutlar

### Backend:
```bash
npm run dev          # Development server başlat
npm run build        # Production build
npm start            # Production server
npm run prisma:studio # Database GUI aç
npm run prisma:seed  # Sample data ekle
npm run db:reset     # Database sıfırla
```

### Frontend:
```bash
npm run dev          # Development server başlat
npm run build        # Production build
npm run preview      # Production preview
```

---

## 📡 API Endpoints

### Authentication:
```
POST /api/auth/register  # Kullanıcı kaydı
POST /api/auth/login     # Giriş
```

### Exercises:
```
GET /api/exercises                    # Tüm egzersizler
GET /api/exercises/:id                # Tek egzersiz
GET /api/exercises/muscle/:group      # Kas grubuna göre
```

### Workouts (Auth Required):
```
POST /api/workouts/sessions/start     # Antrenman başlat
GET /api/workouts/sessions            # Kullanıcı antrenmanları
GET /api/workouts/sessions/:id        # Tek antrenman
PATCH /api/workouts/sessions/:id/end  # Antrenman bitir
```

---

## 🎁 Demo Data

Migration sonrası otomatik eklenir:

**10 Egzersiz:**
1. Barbell Bench Press (Chest)
2. Squat (Legs)
3. Deadlift (Back)
4. Pull-ups (Back)
5. Dumbbell Shoulder Press (Shoulders)
6. Push-ups (Chest)
7. Barbell Rows (Back)
8. Lunges (Legs)
9. Plank (Core)
10. Running (Cardio)

**Demo User:**
- Email: demo@fittrack.com
- Password: demo123456
- Profile: 28 yaş, erkek, 178cm, 80kg

---

## 🔧 Konfigürasyon

### Backend .env (Zaten hazır!):
```bash
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
PORT=3000
NODE_ENV=development
```

### Frontend Proxy (Zaten yapılandırılmış!):
```typescript
// vite.config.ts
server: {
  port: 5173,
  proxy: {
    '/api': 'http://localhost:3000'
  }
}
```

---

## 💾 Database Yönetimi

### Prisma Studio (GUI):
```bash
cd backend
npm run prisma:studio
```
Açılır: http://localhost:5555

**Yapabileceklerin:**
- Tüm tabloları görüntüle
- Verileri düzenle
- Yeni kayıt ekle
- İlişkileri gör

### Database Dosyası:
```
backend/prisma/dev.db  ← Tüm veriler burada!
```

**Yedekleme:**
```bash
cp backend/prisma/dev.db backend/prisma/dev.db.backup
```

**Sıfırlama:**
```bash
cd backend
npm run db:reset
# Evet de, hepsini siler ve yeniden oluşturur
```

---

## 🎨 Frontend Sayfaları

### 1. HomePage (/)
- Hero section
- Feature cards (Workout, Nutrition, Analytics)
- Exercise library
- Muscle group filtering
- Login/Logout nav

### 2. LoginPage (/login)
- Email/password form
- Form validation
- Token storage
- Auto-redirect

### 3. RegisterPage (/register)
- Full registration form
- Password validation
- Auto-login
- Error handling

---

## 🧪 Test Senaryoları

### 1. Health Check:
```bash
curl http://localhost:3000/health
```

### 2. Register:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "username": "testuser",
    "password": "test123456",
    "fullName": "Test User"
  }'
```

### 3. Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@fittrack.com",
    "password": "demo123456"
  }'
```

### 4. Get Exercises:
```bash
curl http://localhost:3000/api/exercises
```

---

## 🆘 Sorun Giderme

### "Module not found"
```bash
# Backend veya web klasöründe:
rm -rf node_modules package-lock.json
npm install
```

### "Prisma Client not generated"
```bash
cd backend
npx prisma generate
```

### "Database file not found"
```bash
cd backend
npx prisma migrate dev --name init
npm run prisma:seed
```

### "Port already in use"
```bash
# Backend için (port 3000):
# Windows: netstat -ano | findstr :3000
# Mac/Linux: lsof -i :3000

# Frontend için (port 5173):
# vite.config.ts'de portu değiştir
```

### Backend çalışmıyor
```bash
cd backend

# .env dosyası var mı kontrol et
cat .env

# Paketler kurulu mu?
npm install

# Prisma hazır mı?
npx prisma generate

# Tekrar dene
npm run dev
```

---

## 📖 Teknolojiler

### Backend:
- **Runtime:** Node.js 20.x
- **Framework:** Express.js 4.18
- **Language:** TypeScript 5.3
- **Database:** SQLite (Prisma ORM 5.8)
- **Auth:** JWT + bcrypt
- **Tools:** ts-node-dev, dotenv, cors

### Frontend:
- **Framework:** React 18.2
- **Language:** TypeScript 5.3
- **Styling:** Tailwind CSS 3.3
- **Build:** Vite 5.0
- **Routing:** React Router 6.20
- **HTTP:** Axios 1.6

---

## 🎯 Sonraki Adımlar

Proje çalışıyor! Şimdi ekleyebileceklerin:

### Hafta 1-2:
- [ ] Workout tracking UI
- [ ] Exercise set logging
- [ ] Timer component
- [ ] Workout history page

### Hafta 3-4:
- [ ] User dashboard
- [ ] Statistics cards
- [ ] Progress charts
- [ ] Goal tracking UI

### Gelecek:
- [ ] Nutrition tracking module
- [ ] Body measurements UI
- [ ] Photo upload
- [ ] Social features
- [ ] Mobile app (React Native)

---

## 📝 Proje Yapısı Detay

### Backend Routes:
```typescript
// auth.routes.ts
POST /api/auth/register  → Kullanıcı kaydı
POST /api/auth/login     → Giriş

// exercise.routes.ts
GET /api/exercises           → Tüm egzersizler
GET /api/exercises/:id       → ID ile
GET /api/exercises/muscle/:group → Filtreleme

// workout.routes.ts (Protected)
POST /api/workouts/sessions/start  → Başlat
GET /api/workouts/sessions         → Liste
GET /api/workouts/sessions/:id     → Detay
PATCH /api/workouts/sessions/:id/end → Bitir
```

### Frontend Components:
```typescript
// App.tsx → Router setup
// HomePage.tsx → Landing + Exercise library
// LoginPage.tsx → Authentication
// RegisterPage.tsx → User registration
// ExerciseList.tsx → Exercise cards + filtering
// api.ts → Axios client + interceptors
```

---

## 🎊 Tamamlanmış Özellikler

- ✅ Full-stack TypeScript
- ✅ JWT Authentication
- ✅ SQLite Database
- ✅ Prisma ORM
- ✅ RESTful API
- ✅ React Frontend
- ✅ Tailwind Styling
- ✅ Responsive Design
- ✅ Form Validation
- ✅ Error Handling
- ✅ Sample Data
- ✅ Database Seeding
- ✅ Protected Routes
- ✅ Token Management

**Toplam:** 27 dosya, ~2,000 satır kod!

---

## 👤 Geliştirici

**İsmet Organ**  
IT Project - FitTrack Pro  
February 2026

---

## 📄 License

MIT License - Educational Project

---

## 🎉 BAŞARILAR!

**Projen hazır!** Şimdi:

1. ✅ Backend'i başlat (`cd backend && npm run dev`)
2. ✅ Frontend'i başlat (`cd web && npm run dev`)
3. ✅ http://localhost:5173 aç
4. ✅ Login ol: demo@fittrack.com / demo123456
5. ✅ Kod yazmaya başla! 💪

**İyi çalışmalar!** 🚀
