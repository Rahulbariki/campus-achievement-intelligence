import sys
import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi import FastAPI

app = FastAPI()

@app.get('/api/health')
def health():
    return {'status': 'ok'}

@app.get('/api/debug')
def debug():
    errors = []
    
    try:
        import auth
        errors.append({'auth': 'OK'})
    except Exception as e:
        errors.append({'auth': str(e)})
    
    try:
        import database
        errors.append({'database': 'OK'})
    except Exception as e:
        errors.append({'database': str(e)})

    try:
        import models
        errors.append({'models': 'OK'})
    except Exception as e:
        errors.append({'models': str(e)})

    try:
        import email_utils
        errors.append({'email_utils': 'OK'})
    except Exception as e:
        errors.append({'email_utils': str(e)})

    try:
        from routes.home_router import home_router
        errors.append({'home_router': 'OK'})
    except Exception as e:
        errors.append({'home_router': str(e)})

    try:
        from routes.auth_router import auth_router
        errors.append({'auth_router': 'OK'})
    except Exception as e:
        errors.append({'auth_router': str(e)})

    try:
        from routes.activity_router import activity_router
        errors.append({'activity_router': 'OK'})
    except Exception as e:
        errors.append({'activity_router': str(e)})

    try:
        from routes.admin_router import admin_router
        errors.append({'admin_router': 'OK'})
    except Exception as e:
        errors.append({'admin_router': str(e)})

    try:
        from routes.event_router import event_router
        errors.append({'event_router': 'OK'})
    except Exception as e:
        errors.append({'event_router': str(e)})
    
    return {
        'sys_path': sys.path,
        'base_dir': BASE_DIR,
        'cwd': os.getcwd(),
        'dir_contents': os.listdir(BASE_DIR),
        'import_results': errors
    }
