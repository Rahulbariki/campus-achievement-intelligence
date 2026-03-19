import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure the backend directory is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

app = FastAPI(title='Campus Achievement AI Platform (Minimal Debug Mode)')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Root routes that don't depend on other modules
@app.get('/api/health')
def health():
    return {'status': 'healthy', 'mode': 'minimal'}

@app.get('/api/')
def root():
    return {'message': 'Campus Achievement AI Platform'}

# Commented out problematic imports for debugging
# try:
#     from routes import home_router, auth_router, activity_router, admin_router, event_router
#     app.include_router(home_router)
#     app.include_router(auth_router, prefix='/api/auth')
#     app.include_router(activity_router, prefix='/api/activity')
#     app.include_router(admin_router, prefix='/api/admin')
#     app.include_router(event_router, prefix='/api')
# except Exception as e:
#     print(f"Import failed: {e}")
