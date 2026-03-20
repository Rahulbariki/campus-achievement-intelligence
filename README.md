# Campus Achievement Intelligence Platform

CAIP is a full-stack starter application for tracking student achievements across hackathons, events, workshops, and certificate-backed participation. The scaffold includes a React frontend, a FastAPI backend, MongoDB integration, Cloudinary upload hooks, and Python AI modules for OCR, press notes, and prediction.

## Canonical Structure

```text
frontend/   React + Vite role-based web client
backend/    FastAPI API layer with JWT RBAC and MongoDB services
ai_engine/  Shared Python modules for OCR, scoring, press notes, prediction
```

The repository also still contains older or parallel exploration folders such as `campus-achievement-ai/`, `dashboard/`, and `python/`. The new starter path introduced in this scaffold is centered on `frontend/`, `backend/`, and `ai_engine/`.

## Implemented Starter Features

- JWT authentication with role-aware users: `student`, `faculty`, `admin`, `hod`, `super_admin`
- Event creation and listing
- Participation submission and score calculation
- Certificate upload flow with Cloudinary-ready storage integration
- Leaderboard and activity-status endpoints
- AI starter modules for OCR extraction, press note generation, and outcome prediction
- React role-based dashboards with forms wired to backend endpoints

## Backend API Surface

- `POST /api/register`
- `POST /api/login`
- `GET /api/me`
- `POST /api/create-event`
- `GET /api/events`
- `POST /api/submit-participation`
- `GET /api/participations`
- `POST /api/upload-certificate`
- `GET /api/certificates`
- `PUT /api/verify-certificate/{id}`
- `DELETE /api/certificate/{id}`
- `GET /api/leaderboard`
- `GET /api/activity-status`
- `POST /api/press-note`
- `POST /api/predict-achievement`

## Local Development

### 1. Backend

```powershell
cd backend
copy .env.example .env
pip install -r requirements.txt
cd ..
uvicorn backend.main:app --reload
```

### 2. Frontend

```powershell
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api` requests to `http://127.0.0.1:8000`.

## Environment Variables

Use [backend/.env.example](/D:/Ai%20Projects/Student%20Activity%20Dashboard/backend/.env.example) and [frontend/.env.example](/D:/Ai%20Projects/Student%20Activity%20Dashboard/frontend/.env.example) as the starting point.

Important backend settings:

- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `JWT_SECRET`
- `ALLOWED_ORIGINS`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Notes

- The Cloudinary upload service falls back to a mock URL when Cloudinary credentials are not configured yet.
- The AI modules are intentionally starter-grade and designed to be upgraded with real OCR, richer NLP, or trained ML models later.
- The frontend is wired to the new FastAPI backend path, and `vercel.json` now targets `backend/main.py`.
