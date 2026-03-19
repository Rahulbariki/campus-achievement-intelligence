import sys
import os
import traceback
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Ensure the backend directory is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

app = FastAPI(title='Campus Achievement AI Platform (Debug Mode)')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Debug Route to see errors
@app.get('/api/debug-errors')
def debug_errors():
    try:
        from routes import home_router, auth_router, activity_router, admin_router, event_router
        return {"status": "all routes imported successfully"}
    except Exception as e:
        return {
            "error": str(e),
            "traceback": traceback.format_exc(),
            "sys_path": sys.path,
            "base_dir": BASE_DIR,
            "cwd": os.getcwd()
        }

@app.get('/api/')
def root():
    return {'message': 'Campus Achievement AI Platform (Debug Mode)'}

# Attempt to include routers, but don't crash the app if they fail
try:
    from routes import home_router, auth_router, activity_router, admin_router, event_router
    app.include_router(home_router)
    app.include_router(auth_router, prefix='/api/auth')
    app.include_router(activity_router, prefix='/api/activity')
    app.include_router(admin_router, prefix='/api/admin')
    app.include_router(event_router, prefix='/api')
except Exception as e:
    print(f"CRITICAL STARTUP ERROR: {e}")
