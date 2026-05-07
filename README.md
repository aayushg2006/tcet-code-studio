# TCET Code Studio

TCET Code Studio is a LeetCode-style coding platform for TCET, designed to integrate with the TCET Centre of Excellence portal.

This repository currently contains:
- `frontend/` - React + Vite + TypeScript client
- `backend/` - Express + TypeScript API server
- Firebase Firestore integration for persistence

## Backend Status

The Phase 1 and Phase 2 backend API work is implemented and tested.

Key backend capabilities:
- mock-auth and JWT-ready auth middleware
- user auto-provisioning on first authenticated request
- faculty problem management APIs
- student problem discovery and detail APIs
- sample code run endpoint with a safe stub execution provider
- judged submission flow with rating updates
- materialized rating-based leaderboard

Leaderboard behavior:
- only `STUDENT` users appear in leaderboard results
- ranking order is `rating desc`, then `accuracy desc`, then `problemsSolved desc`, then `email asc`

## Tech Stack

### Frontend
- React 18
- Vite
- TypeScript
- Tailwind-based UI stack

### Backend
- Node.js
- Express
- TypeScript
- Firebase Admin SDK / Firestore
- Zod validation
- Vitest + Supertest

## Project Structure

```text
tcet-code-studio/
+-- frontend/
+-- backend/
|   +-- src/
|   |   +-- app.ts
|   |   +-- server.ts
|   |   +-- seed.ts
|   |   +-- bootstrap/
|   |   +-- config/
|   |   +-- execution/
|   |   +-- middleware/
|   |   +-- modules/
|   |   |   +-- user/
|   |   |   +-- problem/
|   |   |   +-- submission/
|   |   |   +-- leaderboard/
|   |   +-- shared/
|   |   +-- test/
|   +-- .env.example
|   +-- package.json
|   +-- tsconfig.json
+-- .gitignore
+-- README.md
```

Each backend domain is split into separate files for route, controller, service, repository, model, and validation logic.

## Prerequisites

- Node.js 18+
- npm
- Firebase service account JSON for Firestore access

## Backend Setup

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Configure environment variables

Copy the example file:

```bash
copy .env.example .env
```

Update values as needed in `backend/.env`.

### 3. Add Firebase service account key

Place the Firebase Admin service account file at:

```text
backend/firebase-key.json
```

This file is ignored by git and should never be committed.

### 4. Seed sample data

```bash
npm run seed
```

### 5. Start the backend

```bash
npm run dev
```

Default backend URL:

```text
http://localhost:3000
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Default frontend URL:

```text
http://localhost:5173
```

## Backend Scripts

Run these inside `backend/`:

- `npm run dev` - start the backend with `ts-node-dev`
- `npm run build` - compile TypeScript into `dist/`
- `npm start` - run the compiled backend
- `npm run typecheck` - run TypeScript type checks
- `npm test` - run API tests with Vitest
- `npm run test:watch` - run tests in watch mode
- `npm run seed` - seed Firestore with sample data

## Frontend Scripts

Run these inside `frontend/`:

- `npm run dev` - start Vite dev server
- `npm run build` - create production build
- `npm run build:dev` - create development-mode build
- `npm run preview` - preview built frontend
- `npm run lint` - run ESLint
- `npm run test` - run frontend tests
- `npm run test:watch` - run frontend tests in watch mode

## Environment Variables

The backend reads configuration from `backend/.env`.

Important variables:

- `PORT` - backend port
- `CORS_ORIGIN` - allowed frontend origin(s), comma-separated if needed
- `AUTH_MODE` - `mock` or `jwt`
- `COE_SHARED_TOKEN_SECRET` - JWT secret for COE shared token verification
- `FIREBASE_SERVICE_ACCOUNT_PATH` - path to Firebase service account file
- `FIRESTORE_TEST_COLLECTION` - collection used by `/test-db`
- `EXECUTION_PROVIDER` - currently `stub`
- `MOCK_AUTH_DEFAULT_EMAIL`
- `MOCK_AUTH_DEFAULT_ROLE`
- `MOCK_AUTH_DEFAULT_NAME`
- `MOCK_AUTH_DEFAULT_UID`
- `MOCK_AUTH_DEFAULT_DEPARTMENT`
- `DEFAULT_PROBLEM_TIME_LIMIT_SECONDS`
- `DEFAULT_PROBLEM_MEMORY_LIMIT_MB`
- `RATING_POINTS_EASY`
- `RATING_POINTS_MEDIUM`
- `RATING_POINTS_HARD`

Reference template: `backend/.env.example`

## Authentication

### Mock mode

For development, the backend defaults to:

```text
AUTH_MODE=mock
```

In mock mode, routes can be tested using request headers such as:

- `x-mock-role`
- `x-mock-email`
- `x-mock-name`
- `x-mock-uid`
- `x-mock-department`

Example student headers:

```text
x-mock-role: STUDENT
x-mock-email: student1@tcetmumbai.in
x-mock-name: Student One
```

Example faculty headers:

```text
x-mock-role: FACULTY
x-mock-email: faculty1@tcetmumbai.in
x-mock-name: Prof. Mehta
```

### JWT mode

For portal integration:

```text
AUTH_MODE=jwt
```

In JWT mode, the backend reads the `coe_shared_token` cookie and verifies it using `COE_SHARED_TOKEN_SECRET`.

## Health Endpoints

- `GET /` - basic service status
- `GET /health` - simple health response
- `GET /test-db` - Firestore connectivity check

## API Overview

### User

- `GET /api/users/me`
- `GET /api/user/profile` - legacy compatibility route

### Problems

- `GET /api/problems`
- `GET /api/problems/:problemId`
- `GET /api/problems/manage` - faculty only
- `GET /api/problems/manage/:problemId` - faculty only
- `POST /api/problems` - faculty only
- `PATCH /api/problems/:problemId` - faculty only
- `PATCH /api/problems/:problemId/state` - faculty only

### Submissions

- `POST /api/submissions/run`
- `POST /api/submissions` - student only
- `GET /api/submissions`
- `GET /api/submissions/:submissionId`

### Leaderboard

- `GET /api/leaderboard`
- `GET /api/leaderboard/export` - faculty only

## Submission and Rating Rules

- `/api/submissions/run` is a non-persistent sample run endpoint
- `/api/submissions` creates a judged submission
- judged submissions never execute code directly on the backend server
- current execution uses a safe stub provider
- rating is awarded only for the first accepted unique solve of a problem
- default rating weights are:
  - Easy: `100`
  - Medium: `200`
  - Hard: `300`

## Testing Notes

- Use a fresh Thunder Client request for `GET` endpoints and keep the body empty
- For faculty-only problem APIs, use faculty mock headers
- For student submissions, use student mock headers
- If Firestore rejects `undefined` inside problem test cases, ensure each testcase includes a string `explanation`, even if it is empty

## Verified Backend Commands

These commands were used successfully on this version of the backend:

```bash
cd backend
npm run typecheck
npm test
npm run build
```

## Security Notes

- do not commit `backend/.env`
- do not commit `backend/firebase-key.json`
- do not commit any production JWT secret or service account file
