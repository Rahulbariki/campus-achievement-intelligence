from fastapi import APIRouter, Depends, HTTPException, status
from models import EventCreate, ParticipationCreate, CertificateCreate
from database import events, participations, certificates
from bson import ObjectId

activity_router = APIRouter()

@activity_router.post('/event')
def create_event(event: EventCreate):
    doc = event.dict()
    inserted = events.insert_one(doc)
    return {'message': 'Event created', 'event_id': str(inserted.inserted_id)}

@activity_router.post('/participation')
def create_participation(item: ParticipationCreate):
    if not events.find_one({'_id': ObjectId(item.event_id)}):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Event not found')

    doc = item.dict()
    inserted = participations.insert_one(doc)
    return {'message': 'Participation created', 'participation_id': str(inserted.inserted_id)}

@activity_router.post('/certificate')
def upload_certificate(item: CertificateCreate):
    if not participations.find_one({'_id': ObjectId(item.participation_id)}):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Participation not found')

    doc = item.dict()
    inserted = certificates.insert_one(doc)
    return {'message': 'Certificate saved', 'certificate_id': str(inserted.inserted_id)}
