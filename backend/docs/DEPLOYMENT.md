# TeamFlow — Deployment & Operations Guide

## 1. Prerequisites
- **Node.js**: LTS v20+ (tested on Node v24)
- **PostgreSQL**: v16+
- **Redis**: v7+ (Optional, used for Socket.IO multi-instance adapter and caching)
- **Docker & Docker Compose** (Optional, for containerized deployments)

---

## 2. Local Development Setup

### Step 1: Clone and install dependencies
```bash
cd backend
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `DATABASE_URL` matches your local PostgreSQL instance:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/teamflow_db?schema=public"
JWT_ACCESS_SECRET="your_long_random_jwt_access_secret_min32chars"
JWT_REFRESH_SECRET="your_long_random_jwt_refresh_secret_min32chars"
```

### Step 3: Run Database Migrations
```bash
npm run prisma:migrate
```

### Step 4: Seed Database
```bash
npm run prisma:seed
```
Pre-seeded user accounts for development testing:
- Admin: `admin@teamflow.local` / `Password123!`
- Alice (Owner/Manager): `alice@teamflow.local` / `Password123!`
- Bob (Member/Dev): `bob@teamflow.local` / `Password123!`
- Charlie (Guest): `charlie@teamflow.local` / `Password123!`

### Step 5: Start Development Server
```bash
npm run dev
```
Server will be available at:
- API Root: `http://localhost:5000/api/v1`
- Swagger UI Docs: `http://localhost:5000/api/docs`
- Health Check: `http://localhost:5000/health`

---

## 3. Running Automated Tests
TeamFlow uses Vitest and Supertest for integration and unit testing.

```bash
# Run tests sequentially against the test database
npm test

# Run tests in watch mode
npm run test:watch
```

---

## 4. Production Build & Deployment

### Build TypeScript
```bash
npm run build
```
This outputs compiled JavaScript to `backend/dist`.

### Run Production Server
```bash
npm start
```

---

## 5. Docker Deployment

Deploy the entire stack (PostgreSQL, Redis, and TeamFlow Backend) with Docker Compose:

```bash
# Start all services in the background
docker-compose up -d --build

# Inspect logs
docker-compose logs -f backend

# Run database migrations inside container
docker-compose exec backend npx prisma migrate deploy

# Run seed script inside container
docker-compose exec backend npm run prisma:seed
```

To stop services:
```bash
docker-compose down
```

---

## 6. Production Health Checks & Monitoring
- **Health check URL**: `GET /health`
  Returns `200 OK` with uptime and environment status.
- **Structured Logs**: Production output formatted via Pino with correlation fields and timestamping.
