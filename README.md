# TCET Code Studio

TCET Code Studio is a role-based coding platform with a React frontend, an Express backend, Firebase/Firestore persistence, and a local mock SSO server for development.

## Current System Overview

This repo contains:

- `frontend/` - React + Vite + TypeScript app (default: `http://localhost:5173`)
- `backend/` - Express + TypeScript API (default: `http://localhost:3001`)
- `mock-sso-server.js` - local SSO simulator (default: `http://localhost:4000`)

Key implemented behavior:

- cookie-based SSO auth (`coe_shared_token`)
- backend SSO callback route: `GET /api/auth/sso/callback`
- role-based redirect after login:
  - `STUDENT` -> `/student/dashboard`
  - `FACULTY` -> `/faculty/dashboard`
- automatic user provisioning in Firestore on first authenticated request
- role-based route protection across backend APIs
- role-based UI routing in frontend (manual role switch removed)

## Authentication Flow (Current)

1. User opens frontend and clicks sign-in.
2. Frontend sends user to `mock-sso-server` login page.
3. Mock SSO sets `coe_shared_token` cookie and redirects to backend callback.
4. Backend callback validates JWT cookie, sets `req.user`, auto-creates user if missing, then redirects to the role dashboard.
5. Frontend calls APIs using `credentials: include`.

Important notes:

- Keep host consistent (`localhost` everywhere, or `127.0.0.1` everywhere).
- If mixed, browser cookie scope can break and cause login loops.

## Role Rules

- `STUDENT`
  - can submit solutions: `POST /api/submissions`
  - appears on leaderboard
- `FACULTY`
  - can manage problems and export leaderboard
  - cannot submit on student submission endpoint

## Prerequisites

- Node.js 18+
- npm
- Firebase Admin service account key (JSON)

## Quick Start

### 1. Backend

```bash
cd backend
npm install
```

Create `backend/.env` and set at least:

```env
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
COE_SHARED_TOKEN_SECRET=local_dev_secret_key_123
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-key.json
```

Place Firebase key at:

```text
backend/firebase-key.json
```

Run backend:

```bash
npm run dev
```

Optional seed:

```bash
npm run seed
```

### 2. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3001
```

Run frontend:

```bash
npm run dev
```

### 3. Mock SSO server

From repo root:

```bash
node mock-sso-server.js
```

Default URL:

```text
http://localhost:4000
```

## Runtime Ports

- Frontend: `5173`
- Backend API: `3001`
- Mock SSO: `4000`

## API Highlights

### Auth and Session

- `GET /api/auth/sso/callback` - validates cookie and redirects by role
- `GET /api/logout` - clears SSO cookie via mock SSO logout redirect

### Health

- `GET /`
- `GET /health`
- `GET /test-db`

### Users

- `GET /api/users/me`
- `GET /api/user/profile` (legacy compatibility)
- `GET /api/users/:email` (faculty only)

### Problems

- `GET /api/problems`
- `GET /api/problems/:problemId`
- `GET /api/problems/manage` (faculty only)
- `GET /api/problems/manage/:problemId` (faculty only)
- `POST /api/problems` (faculty only)
- `PATCH /api/problems/:problemId` (faculty only)
- `PATCH /api/problems/:problemId/state` (faculty only)

### Submissions

- `POST /api/submissions/run` (non-persistent test run)
- `POST /api/submissions` (student only, queued + judged)
- `GET /api/submissions`
- `GET /api/submissions/:submissionId`

### Leaderboard

- `GET /api/leaderboard`
- `GET /api/leaderboard/export` (faculty only)

## User Auto-Provisioning

Users are automatically created/updated when authenticated requests hit protected routes.

Provisioned fields include:

- email
- role
- uid/name/department (if present in token)
- stats defaults (`rating`, `score`, `problemsSolved`, etc.)

## Scripts

### Backend (`backend/`)

- `npm run dev`
- `npm run dev:worker`
- `npm run build`
- `npm run start`
- `npm run start:worker`
- `npm run typecheck`
- `npm run test`
- `npm run test:watch`
- `npm run seed`
- `npm run loadtest:queue`

### Frontend (`frontend/`)

- `npm run dev`
- `npm run build`
- `npm run build:dev`
- `npm run preview`
- `npm run lint`
- `npm run test`
- `npm run test:watch`

## Troubleshooting

### Login loop between frontend and SSO

- Use same host across services (`localhost` recommended).
- Clear old cookies for both `localhost` and `127.0.0.1`.
- Restart frontend, backend, and mock SSO server.

### "You are not allowed to access this resource" on submit

- Submit endpoint is `STUDENT` only.
- Sign in with `STUDENT` role in mock SSO.

### "Failed to fetch"

- Confirm frontend points to backend `3001`.
- Ensure backend CORS includes your frontend origin.
- Ensure all three processes are running.

## Security Notes

- Never commit secrets or credentials.
- Keep these files private:
  - `backend/.env`
  - `backend/firebase-key.json`
- Temporary debug files are ignored by pattern `tmp-*.txt`.
