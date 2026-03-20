from fastapi import APIRouter
from database import certificates
from datetime import datetime

home_router = APIRouter()

@home_router.get('/')
def home():
    return {'message': 'Campus Achievement AI Platform'}

@home_router.get('/api/bulletin')
def get_bulletin():
    # Fetch 3 most recent verified achievements
    recent = list(certificates.find({'verified': True}, {'_id': 0}).sort('uploaded_at', -1).limit(3))
    return {
        'date': datetime.now().strftime("%B %d, %Y"),
        'edition': 'Morning Edition',
        'articles': recent
    }
