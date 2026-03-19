import sys
import os
from fastapi import FastAPI

# Ensure backend dir is in sys.path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from routes import home_router
app = FastAPI()
app.include_router(home_router)

@app.get("/api/health")
def health():
    return {"status": "ok"}
