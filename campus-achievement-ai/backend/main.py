from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import home_router, auth_router, activity_router, admin_router, event_router

app = FastAPI(title='Campus Achievement AI Platform')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000', 'http://127.0.0.1:3000'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

from fastapi.staticfiles import StaticFiles

app.include_router(home_router)
app.include_router(auth_router, prefix='/api/auth')
app.include_router(activity_router, prefix='/api/activity')
app.include_router(admin_router, prefix='/api/admin')
app.include_router(event_router, prefix='/api')

# Ensure static certificate dir exists before mounting
import os
CERT_DIR = '/tmp/certificates' if os.environ.get('VERCEL') else 'certificates'
os.makedirs(CERT_DIR, exist_ok=True)
app.mount('/certificate-files', StaticFiles(directory=CERT_DIR), name='certificates')

@app.get('/health')
def health():
    return {'status': 'healthy'}

@app.get('/')
def root():
    return {'message': 'Campus Achievement AI Platform'}
