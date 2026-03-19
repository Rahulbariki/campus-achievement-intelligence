import sys
import os
from dotenv import load_dotenv

# Load .env
load_dotenv()

# Ensure backend dir is in sys.path for module resolution
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routes.home_router import home_router
from routes.auth_router import auth_router
from routes.activity_router import activity_router
from routes.admin_router import admin_router
from routes.event_router import event_router

app = FastAPI(title='Campus Achievement AI Platform')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Register all routers
app.include_router(home_router)
app.include_router(auth_router, prefix='/api/auth')
app.include_router(activity_router, prefix='/api/activity')
app.include_router(admin_router, prefix='/api/admin')
app.include_router(event_router, prefix='/api')

# Static file serving for certificates
CERT_DIR = '/tmp/certificates' if os.environ.get('VERCEL') else 'certificates'
os.makedirs(CERT_DIR, exist_ok=True)
app.mount('/certificate-files', StaticFiles(directory=CERT_DIR), name='certificates')

@app.get('/api/health')
def health():
    return {'status': 'healthy'}
