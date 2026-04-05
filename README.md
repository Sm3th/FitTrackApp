# FitTrack Pro

A full-stack fitness tracking web application built with React 18, Node.js, and SQLite. Designed as a thesis-quality project demonstrating modern web development practices including CI/CD, Docker, PWA, i18n, and comprehensive testing.

![CI](https://github.com/Sm3th/FitTrackApp/actions/workflows/ci.yml/badge.svg)

## Features

### Workout Tracking
- Start, log, and end workout sessions with real-time timers
- Log sets with reps, weight, and notes per exercise
- Personal record (PR) detection with celebration effects
- Post-workout rating and notes
- Workout history with search, sort, and PDF export
- Share workouts via encoded URL

### Training Plans & Guided Workouts
- 20 pre-built workout plans (beginner to advanced)
- Filter by difficulty and category (strength, cardio, HIIT, etc.)
- Guided workout mode with phase-aware timers (ready → exercise → rest)
- Exercise demo modal with instructions, tips, and common mistakes

### Analytics & Stats
- Volume, sets, and personal record charts (Recharts)
- Weekly vs previous week comparison
- Smart insights engine
- Muscle group heatmap (SVG front/back body overlay)
- XP level system with progression badges

### AI Coach
- Rule-based recommendation engine analyzing workout history
- Detects: inactivity, overtraining, push/pull imbalance, leg day skipping, core neglect, progressive overload opportunities
- Fitness score 0–100 with tier labels (Beginner → Elite)
- Personalized 7-day weekly training plan

### Nutrition
- Daily food logging with macro breakdown (calories, protein, carbs, fat)
- Live food search via Open Food Facts API
- Meal grouping (breakfast, lunch, dinner, snacks)
- Day navigation and custom nutrition goals

### Other Pages
- Achievements — 20+ unlockable badges with progress tracking
- Leaderboard — ranked by workouts, volume, or duration (real backend data)
- Body Measurements — AreaChart, BMI calculator, color-coded delta stats
- Water Intake — circular ring tracker with 7-day history
- Progress Photos — before/after comparison with timeline gallery
- Workout Calendar — monthly heatmap view
- Workout Templates, Reminders, Tips, Exercise Library
- Calculators — 1RM (4 formulas), TDEE, Macro splitter
- Daily Challenges — XP-based challenge system

### PWA
- Installable on desktop and mobile
- Offline support via service worker
- Push notifications for workout reminders
- App shortcuts and splash screens

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Routing | React Router v6 (28 lazy-loaded pages) |
| Charts | Recharts |
| i18n | i18next — English, Turkish, Polish |
| Backend | Node.js, Express, TypeScript |
| ORM | Prisma + SQLite |
| Auth | JWT (jsonwebtoken) |
| API Docs | Swagger UI at `/api/docs` |
| Testing | Vitest (31 frontend), Jest+Supertest (11 backend), Playwright E2E (42 tests) |
| CI/CD | GitHub Actions (3 jobs: backend, frontend, E2E) |
| Deployment | Docker multi-stage builds + nginx reverse proxy |

---

## Project Structure

```
fittrack-complete/
├── backend/                  # Node.js + Express API
│   ├── src/
│   │   ├── routes/           # auth, workouts, exercises, nutrition, metrics, users
│   │   ├── services/         # PrismaService with all DB methods
│   │   ├── middleware/       # JWT auth middleware
│   │   └── server.ts
│   ├── prisma/schema.prisma
│   └── Dockerfile
├── web/                      # React frontend
│   ├── src/
│   │   ├── pages/            # 28 pages (all lazy-loaded)
│   │   ├── components/       # Shared components
│   │   ├── contexts/         # ThemeContext, ToastContext
│   │   ├── hooks/            # useCountUp, useDebounce, useScrollToTop, ...
│   │   ├── utils/            # aiRecommendations, statsHelper, pdfGenerator, ...
│   │   ├── i18n/             # EN / TR / PL translations
│   │   └── services/api.ts   # Centralized apiClient (axios + interceptors)
│   ├── e2e/                  # Playwright E2E tests
│   ├── public/               # PWA assets, service worker, manifest
│   └── Dockerfile
├── .github/workflows/ci.yml  # GitHub Actions CI/CD
├── docker-compose.yml
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 22+
- npm

### Local Development

```bash
# 1. Clone the repo
git clone https://github.com/Sm3th/FitTrackApp.git
cd FitTrackApp

# 2. Start the backend
cd backend
npm install
npx prisma db push
npm run dev          # runs on http://localhost:3000

# 3. Start the frontend (new terminal)
cd web
npm install
npm run dev          # runs on http://localhost:5173
```

### Environment Variables

**Backend** — create `backend/.env`:
```env
PORT=3000
DATABASE_URL=file:./prisma/fittrack.db
JWT_SECRET=your-secret-key-minimum-32-characters
```

**Frontend** — create `web/.env`:
```env
VITE_API_URL=http://localhost:3000/api
```

---

## Docker

```bash
JWT_SECRET=your-secret-key docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/api/docs

---

## Testing

```bash
# Frontend unit tests (Vitest — 31 tests)
cd web && npm test

# Backend tests (Jest + Supertest — 11 tests)
cd backend && npm test

# E2E tests (Playwright — 42 tests, Chromium + Pixel 7 mobile)
cd web && npm run test:e2e
```

---

## Deployment

### Frontend — Vercel
1. Import repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `web`
3. Add environment variable: `VITE_API_URL=https://your-backend.railway.app/api`

### Backend — Railway
1. Import repo on [railway.app](https://railway.app)
2. Set **Root Directory** to `backend`
3. Add environment variables:
   ```
   JWT_SECRET=your-production-secret-minimum-32-chars
   DATABASE_URL=file:/data/fittrack.db
   PORT=3000
   ```
4. Add a **Volume** mounted at `/data`

---

## API Reference

Full interactive docs at `/api/docs` (Swagger UI).

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login |
| GET | `/api/workouts/sessions` | JWT | List sessions |
| POST | `/api/workouts/sessions/start` | JWT | Start session |
| PATCH | `/api/workouts/sessions/:id/end` | JWT | End session |
| POST | `/api/workouts/sets` | JWT | Log a set |
| GET | `/api/exercises` | — | List exercises |
| GET | `/api/nutrition` | JWT | Get nutrition logs |
| POST | `/api/nutrition` | JWT | Add food entry |
| GET | `/api/metrics` | JWT | Get body metrics |
| POST | `/api/metrics` | JWT | Add metric |
| GET | `/api/users/leaderboard` | JWT | Get leaderboard |
| GET | `/api/users/me` | JWT | Get current user |
| PATCH | `/api/users/me` | JWT | Update profile |

---

## License

MIT
