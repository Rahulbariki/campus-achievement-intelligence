from fastapi import APIRouter, Depends, HTTPException, status
import os
import sys

# Ensure root path can import ai_engine package
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from routes.security import check_role
from database import certificates, users, participations, press_notes, events
from bson import ObjectId
from datetime import datetime
from ai_engine.press_note_generator import generate_press_note, generate_social_media_post

admin_router = APIRouter()

@admin_router.post('/certificate/verify')
def verify_certificate(certificate_id: str, user: dict = Depends(check_role('admin', 'hod', 'super_admin'))):
    doc = certificates.find_one({'_id': ObjectId(certificate_id)})
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Certificate not found')
    certificates.update_one({'_id': ObjectId(certificate_id)}, {'$set': {'verified': True}})
    return {'message': 'Certificate verified', 'verified_by': user['email']}

@admin_router.post('/generate-press-note')
def create_press_note(student_email: str, event_name: str, user: dict = Depends(check_role('admin', 'hod', 'super_admin'))):
    # Fetch student details
    student = users.find_one({'email': student_email})
    if not student:
        raise HTTPException(status_code=404, detail='Student not found')
    
    # Fetch participation/achievement details
    participation = participations.find_one({'student_email': student_email, 'event_name': event_name})
    if not participation:
        raise HTTPException(status_code=404, detail='Participation record not found')
    
    # Fetch event details (organizer)
    event = events.find_one({'event_name': event_name})
    organizer = event.get('organizer', 'the organizers') if event else 'the organizers'
    
    # Generate content
    press_text = generate_press_note(
        student_name=student.get('name'),
        department=student.get('department', 'N/A'),
        year=student.get('year', 0),
        event_name=event_name,
        organizer=organizer,
        achievement=participation.get('achievement', 'participation')
    )
    
    social_text = generate_social_media_post(
        student_name=student.get('name'),
        department=student.get('department', 'N/A'),
        event_name=event_name,
        achievement=participation.get('achievement', 'participation')
    )
    
    # Save to database
    press_notes.insert_one({
        'student_email': student_email,
        'event_name': event_name,
        'press_note': press_text,
        'social_media_post': social_text,
        'generated_by': user['email'],
        'created_at': datetime.utcnow()
    })
    
    return {
        'message': 'Press note generated successfully',
        'press_note': press_text,
        'social_media_post': social_text
    }

@admin_router.post('/user/promote-super-admin')
def promote_super_admin(email: str, user: dict = Depends(check_role('super_admin'))):
    from database import users
    existing = users.find_one({'email': email})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')
    users.update_one({'email': email}, {'$set': {'role': 'super_admin'}})
    return {'message': f'{email} promoted to super_admin', 'updated_by': user['email']}
