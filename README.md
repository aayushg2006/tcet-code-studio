# TCET Code Studio

TCET Code Studio includes:
- A React + Vite frontend (`frontend/`)
- A Node.js + Express + TypeScript backend (`backend/`)
- Firebase Firestore integration for data storage

## Project Structure

- `frontend/` - React app (Vite + TypeScript)
- `backend/` - Express API server (TypeScript + Firebase Admin)

## Prerequisites

- Node.js 18+ (recommended)
- npm
- Firebase service account key JSON

## Backend Setup

1. Install dependencies:

```bash
cd backend
npm install
```

2. Add Firebase service account key:
- Place your key at `backend/firebase-key.json`
- This file is gitignored and should never be committed

3. Run backend server:

```bash
npm run dev
```

Backend runs at `http://localhost:3000`.

## Backend Scripts

- `npm run dev` - Start backend in development mode with `ts-node-dev`
- `npm run seed` - Seed Firestore with sample users, problems, submissions, and leaderboard data

## Backend API (Current)

- `GET /` - Health check text response (`Backend running`)
- `GET /test-db` - Writes a test document to Firestore and confirms DB connectivity
- `GET /api/user/profile` - Returns user profile (creates default user document if missing)

## Auth Behavior (Current)

`backend/src/middleware/auth.ts` is currently using a mock auth flow (hardcoded decoded user) for development/testing. The JWT-based middleware is present in comments and can be restored when integrating real authentication.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs via Vite (default `http://localhost:5173`).
