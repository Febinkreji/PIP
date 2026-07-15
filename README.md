# PIP (Payment Incident Platform)

PIP is a system for tracking, analyzing, and surfacing insights about payment-related incidents. It combines a React dashboard, a Node.js/Express API, and Firebase (Auth + Firestore) to help teams detect, investigate, and resolve payment incidents faster.

## Features

- **Dashboard** — live incident feed, executive stats, search/filter with cursor-based pagination.
- **Analytics** — executive overview, trends, severity/status distributions, heatmaps, regional and merchant analytics.
- **Incident Details** — AI root-cause summary, evidence workspace (60+ monitored sources with root-cause likelihood), AI correlation graph, impact panel, workflow timeline, interactive runbooks, and role-gated workflow actions.
- **Role-based access control** — `ADMIN`, `ENGINEER`, `MANAGER`, `VIEWER` via Firebase custom claims.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite |
| Backend | Node.js + Express |
| Database | Firebase Firestore (Spark plan — see [Architecture](#architecture)) |
| Auth | Firebase Authentication (custom claims for RBAC) |

## Architecture

Firestore usage is intentionally minimized to stay within the free Spark plan:

- Precomputed summary documents (`dashboardStats/current`, `analyticsSummary/current`, `serviceMetrics/{service}`, `dailyMetrics/{date}`) are maintained incrementally by `StatisticsService`, so the Dashboard and Analytics pages each cost a single document read.
- Incident lists use real cursor-based pagination (`startAfter`/`endBefore`), never full collection scans.
- The Incident Details page performs exactly 3 reads per visit (incident, investigation, recommendation) — every other section on that page (evidence panels, correlation graph, runbook, pinned anomalies) is derived in memory from that same data, not fetched separately.

See [docs/architecture.md](docs/architecture.md) for the full design.

## Project Structure

```
payment-incident-intelligence-platform/
├── frontend/    # React + Vite dashboard
├── backend/     # Express API + Firestore access layer
└── docs/        # Architecture notes and deployment guides
```

## Local Setup

### Prerequisites

- Node.js 18+
- A Firebase project with Firestore and Authentication (Email/Password) enabled

### 1. Firebase configuration

1. Create a Firebase project (or reuse an existing one) at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Firestore Database** and **Authentication → Email/Password**.
3. Register a Web App and copy its config values into `frontend/.env` (see `frontend/.env.example`).
4. Generate a service account key: **Project Settings → Service Accounts → Generate new private key**. Save the downloaded JSON file into `backend/src/config/firebase/` (this folder is git-ignored — the key is never committed).

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # optional locally; only PORT/CORS_ORIGINS matter outside production
npm run dev             # starts on http://localhost:5000
```

Health check: `GET http://localhost:5000/health`.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env    # fill in the Firebase web config from step 1
npm run dev              # starts on http://localhost:5173
```

`VITE_API_BASE_URL` defaults to `http://localhost:5000` if unset.

### 4. Role setup

Firebase custom claims (roles) don't exist until assigned. Bootstrap the default demo users:

```bash
cd backend
node scripts/setupRoles.js
```

This assigns `ADMIN`/`ENGINEER`/`MANAGER`/`VIEWER` to `admin@platform.com`, `engineer@platform.com`, `manager@platform.com`, `viewer@platform.com` (password `Password@123`), creating them in Firebase Auth if they don't already exist. To set a role for a single user instead:

```bash
node scripts/setupRoles.js someone@example.com ENGINEER
```

Re-run this script after switching Firebase projects — custom claims are project-scoped and never carry over.

### 5. Seed demo data

```bash
cd backend
node scripts/seedDemoData.js
```

Generates ~100 realistic incidents (configurable via `SEED_COUNT`) and recomputes the dashboard/analytics summary documents, using a small, fixed number of Firestore reads/writes regardless of dataset size.

## Deployment

- Frontend → Vercel: [docs/deploy-vercel.md](docs/deploy-vercel.md)
- Backend → Render: [docs/deploy-render.md](docs/deploy-render.md)

## Environment Variables

**frontend/.env** (see `frontend/.env.example`)

| Variable | Purpose |
|---|---|
| `VITE_FIREBASE_API_KEY` / `VITE_FIREBASE_AUTH_DOMAIN` / `VITE_FIREBASE_PROJECT_ID` / `VITE_FIREBASE_STORAGE_BUCKET` / `VITE_FIREBASE_MESSAGING_SENDER_ID` / `VITE_FIREBASE_APP_ID` | Firebase web app config |
| `VITE_API_BASE_URL` | Backend base URL. Defaults to `http://localhost:5000` |

**backend/.env** (see `backend/.env.example`)

| Variable | Purpose |
|---|---|
| `PORT` | API port (Render sets this automatically) |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins. Unset = allow all (local dev default) |
| `FIREBASE_SERVICE_ACCOUNT` | Service account JSON (raw or base64) — required in production; local dev instead uses the JSON file in `backend/src/config/firebase/` |

## License

MIT — see [LICENSE](LICENSE).
