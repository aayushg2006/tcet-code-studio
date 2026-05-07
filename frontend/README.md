# TCET Code Studio Frontend

## Setup

```bash
npm install
npm run dev
```

By default, the app runs at `http://localhost:5173`.

## Environment

Create `.env` from `.env.example` and configure:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

## Backend Compatibility

This frontend is wired to the existing backend APIs (no backend changes required).

For local development with backend `AUTH_MODE=mock`:
- routes under `/student/*` send student mock auth headers
- routes under `/faculty/*` send faculty mock auth headers

For JWT mode, the client already sends `credentials: include` so cookie auth works once backend is configured.
