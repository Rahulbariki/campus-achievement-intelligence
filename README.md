# Student Achievement Monitoring Dashboard (HOD & Admin)

Full-stack project with:
- Node.js + Express API
- MongoDB schema and RBAC (student/admin/hod/superadmin)
- Python AI analytics module
- Streamlit dashboard for HOD Admin monitoring
- Simple web form for student event submission

## Features
- Event/hackathon participation logging
- Certificate file upload metadata
- Participation/winner scoring and activity categorization
- Press note generation for achievements
- Time-based analytics (daily/weekly/monthly/yearly)
- Active/inactive student monitoring

## Quick start
1. Install Node backend dependencies (in `backend`):
   - `npm install`
2. Setup MongoDB and environment variables in `.env`
   - `MONGODB_URI`, `JWT_SECRET`
3. Run backend
   - `npm run dev`
4. Setup Python module (in `python`)
   - `pip install -r requirements.txt`
5. Run Streamlit dashboard (in `dashboard`)
   - `streamlit run streamlit_app.py`

## Campus Achievement AI backend

1. Change to `campus-achievement-ai/backend`
2. Create `.env` with:
   - `MONGODB_URI=mongodb://localhost:27017`
   - `DB_NAME=campus_achievement`
   - `JWT_SECRET=<your_jwt_secret>`
3. Install dependencies:
   - `pip install -r requirements.txt`
4. Run service:
   - `uvicorn main:app --host 0.0.0.0 --port 8000 --reload`
