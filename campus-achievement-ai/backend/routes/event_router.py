from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from datetime import datetime
import os
import sys
import shutil
import uuid

# Ensure root path can import ai_engine package
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from models import Event, Participation, Certificate
from database import events, participations, certificates, audit_logs, notifications, activity_scores
from routes.security import check_role, get_current_user
from ai_engine.certificate_ocr import extract_text_from_certificate, auto_verify_certificate
from ai_engine.achievement_predictor import predict_achievement_success
from email_utils import send_mail

event_router = APIRouter()


def get_achievement_points(level: str):
    mapping = {
        'participant': 20,
        'participation': 20,
        'runner_up': 50,
        'finalist': 70,
        'winner': 100
    }
    return mapping.get(level, 20)


def update_activity_score(student_email: str):
    user_participations = list(participations.find({'student_email': student_email}))
    total_points = 0
    total_participations = len(user_participations)
    total_wins = 0

    for p in user_participations:
        points = get_achievement_points(p.get('achievement', 'participant'))
        total_points += points
        if p.get('achievement') == 'winner':
            total_wins += 1

    activity_scores.update_one(
        {'student_email': student_email},
        {'$set': {
            'total_points': total_points,
            'participations': total_participations,
            'wins': total_wins,
            'last_updated': datetime.utcnow()
        }},
        upsert=True
    )


def send_notification(user_email: str, message: str):
    notifications.insert_one({
        'notification_id': str(uuid.uuid4()),
        'user_email': user_email,
        'message': message,
        'read': False,
        'created_at': datetime.utcnow()
    })


@event_router.post('/create-event')
def create_event(event: Event, user: dict = Depends(check_role('admin', 'hod', 'super_admin'))):
    events.insert_one(event.dict())
    return {'message': 'Event created successfully'}

@event_router.get('/events')
def get_events():
    all_events = list(events.find({}, {'_id': 0}))
    return all_events

@event_router.put('/update-event/{event_name}')
def update_event(event_name: str, event: Event, user: dict = Depends(check_role('admin', 'hod', 'super_admin'))):
    res = events.update_one({'event_name': event_name}, {'$set': event.dict()})
    if res.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Event not found')
    return {'message': 'Event updated'}

@event_router.delete('/delete-event/{event_name}')
def delete_event(event_name: str, user: dict = Depends(check_role('admin', 'hod', 'super_admin'))):
    res = events.delete_one({'event_name': event_name})
    if res.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Event not found')
    return {'message': 'Event deleted'}

import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url

# Configure Cloudinary
cloudinary.config(
    cloud_name="dpksazh3t",
    api_key="696413681477928",
    api_secret="Wk50a83sZTcpOaFL0LcTSCF7XSg",
    secure=True
)

@event_router.post('/upload-certificate')
def upload_certificate(
    student_email: str,
    event_name: str,
    achievement: str,
    file: UploadFile = File(...),
    user: dict = Depends(check_role('student', 'admin', 'hod', 'super_admin'))
):
    if user.get('role') != 'student' and user.get('role') not in ['admin', 'hod', 'super_admin']:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only student/admin/hod/super_admin can upload certificates')

    ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    MAX_BYTES = 10 * 1024 * 1024

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Invalid file type')

    file.file.seek(0, os.SEEK_END)
    size = file.file.tell()
    file.file.seek(0)

    if size > MAX_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail='File size exceeds 10MB')

    # 1. Save Locally for OCR / Audit
    CERT_DIR = '/tmp/certificates' if os.environ.get('VERCEL') else 'certificates'
    os.makedirs(CERT_DIR, exist_ok=True)
    safe_name = os.path.basename(file.filename)
    unique_name = f"{uuid.uuid4().hex}_{safe_name}"
    file_path = os.path.join(CERT_DIR, unique_name)

    with open(file_path, 'wb') as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 2. Upload to Cloudinary for Persistence
    try:
        upload_result = cloudinary.uploader.upload(file_path, folder="campus_certificates")
        cloud_url = upload_result.get('secure_url')
    except Exception as e:
        print(f"Cloudinary upload failed: {e}")
        cloud_url = None

    certificates.insert_one({
        'student_email': student_email,
        'event_name': event_name,
        'achievement': achievement,
        'file_name': unique_name,
        'original_file_name': safe_name,
        'cloudinary_url': cloud_url,
        'verified': False,
        'verified_by': None,
        'verification_comment': None,
        'rejection_reason': None,
        'uploaded_at': datetime.utcnow()
    })

    audit_logs.insert_one({
        'action': 'upload_certificate',
        'file_name': file.filename,
        'cloudinary_url': cloud_url,
        'user': user.get('email'),
        'role': user.get('role'),
        'timestamp': datetime.utcnow()
    })

    return {'message': 'Certificate uploaded successfully', 'url': cloud_url}

@event_router.get('/certificates')
def get_certificates(user: dict = Depends(check_role('admin', 'hod', 'super_admin'))):
    data = list(certificates.find({}, {'_id': 0}))
    return data

@event_router.put('/verify-certificate/{file_name}')
def verify_certificate(file_name: str, comment: str = None, user: dict = Depends(check_role('admin', 'hod', 'super_admin'))):
    cert = certificates.find_one({'file_name': file_name})
    if not cert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Certificate not found')

    certificates.update_one({'file_name': file_name}, {'$set': {'verified': True, 'verified_by': user.get('email'), 'verification_comment': comment, 'rejection_reason': None}})

    audit_logs.insert_one({
        'action': 'verify_certificate',
        'file_name': file_name,
        'user': user.get('email'),
        'role': user.get('role'),
        'comment': comment,
        'timestamp': datetime.utcnow()
    })

    send_notification(cert['student_email'], f"Your certificate '{file_name}' has been verified.")
    try:
        send_mail(cert['student_email'], 'Certificate Verified', f"Your certificate '{file_name}' has been verified by {user.get('email')}.")
    except Exception as e:
        print('Email send failed:', e)

    return {'message': 'Certificate verified'}

@event_router.put('/reject-certificate/{file_name}')
def reject_certificate(file_name: str, reason: str, user: dict = Depends(check_role('admin', 'hod', 'super_admin'))):
    cert = certificates.find_one({'file_name': file_name})
    if not cert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Certificate not found')

    certificates.update_one({'file_name': file_name}, {'$set': {'verified': False, 'verified_by': user.get('email'), 'verification_comment': None, 'rejection_reason': reason}})

    audit_logs.insert_one({
        'action': 'reject_certificate',
        'file_name': file_name,
        'user': user.get('email'),
        'role': user.get('role'),
        'reason': reason,
        'timestamp': datetime.utcnow()
    })

    send_notification(cert['student_email'], f"Your certificate '{file_name}' was rejected: {reason}")
    try:
        send_mail(cert['student_email'], 'Certificate Rejected', f"Your certificate '{file_name}' was rejected by {user.get('email')} with reason: {reason}.")
    except Exception as e:
        print('Email send failed:', e)

    return {'message': 'Certificate rejected'}

@event_router.delete('/delete-certificate/{file_name}')
def delete_certificate(file_name: str, user: dict = Depends(check_role('admin', 'hod', 'super_admin'))):
    res = certificates.delete_one({'file_name': file_name})
    if res.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Certificate not found')

    audit_logs.insert_one({
        'action': 'delete_certificate',
        'file_name': file_name,
        'user': user.get('email'),
        'role': user.get('role'),
        'timestamp': datetime.utcnow()
    })

    return {'message': 'Certificate removed'}

@event_router.post('/submit-participation')
def submit_participation(data: Participation, user: dict = Depends(get_current_user)):
    if user.get('role') != 'student':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only students can submit participation')

    participations.insert_one(data.dict())
    update_activity_score(data.student_email)
    send_notification(data.student_email, f"Participation in {data.event_name} recorded.")
    try:
        send_mail(data.student_email, 'Participation Recorded', f"Your participation for {data.event_name} has been recorded.")
    except Exception as e:
        print('Email send failed:', e)
    return {'message': 'Participation submitted'}

@event_router.get('/participations')
def get_participations(user: dict = Depends(get_current_user)):
    if user.get('role') in ['admin', 'hod', 'super_admin']:
        items = list(participations.find({}, {'_id': 0}))
    else:
        items = list(participations.find({'student_email': user.get('email')}, {'_id': 0}))
    return items

@event_router.get('/my-certificates')
def get_my_certificates(user: dict = Depends(get_current_user)):
    items = list(certificates.find({'student_email': user.get('email')}, {'_id': 0}))
    return items

@event_router.get('/activity-score')
def get_activity_score(user: dict = Depends(get_current_user)):
    score = activity_scores.find_one({'student_email': user.get('email')}, {'_id': 0})
    if not score:
        return {'student_email': user.get('email'), 'total_points': 0, 'participations': 0, 'wins': 0}
    return score

@event_router.get('/activity-ranking')
def get_activity_ranking(user: dict = Depends(check_role('admin', 'hod', 'super_admin'))):
    ranking = list(activity_scores.find({}, {'_id': 0}).sort('total_points', -1))
    return ranking

@event_router.get('/activity-status')
def get_activity_status(user: dict = Depends(check_role('admin', 'hod', 'super_admin'))):
    active = list(activity_scores.find({'participations': {'$gte': 5}}, {'_id': 0}))
    moderate = list(activity_scores.find({'participations': {'$gte': 2, '$lt': 5}}, {'_id': 0}))
    inactive = list(activity_scores.find({'participations': {'$lt': 2}}, {'_id': 0}))

    return {
        'highly_active': active,
        'moderate': moderate,
        'inactive': inactive,
        'counts': {
            'highly_active': len(active),
            'moderate': len(moderate),
            'inactive': len(inactive)
        }
    }


@event_router.get('/certificate-audit')
def get_audit_logs(user: dict = Depends(check_role('admin', 'hod', 'super_admin'))):
    logs = list(audit_logs.find({}, {'_id': 0}))
    return logs

@event_router.get('/notifications')
def get_notifications(user: dict = Depends(get_current_user)):
    items = list(notifications.find({'user_email': user.get('email')}, {'_id': 0}).sort('created_at', -1))
    return items

@event_router.put('/notifications/{notification_id}/read')
def mark_notification_read(notification_id: str, user: dict = Depends(get_current_user)):
    notifications.update_one({'user_email': user.get('email'), 'notification_id': notification_id}, {'$set': {'read': True}})
    return {'message': 'Notification marked as read'}

@event_router.post('/ocr-verify')
def ocr_certificate(event_name: str, student_email: str, file_name: str, user: dict = Depends(get_current_user)):
    cert = certificates.find_one({'file_name': file_name})
    if not cert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Certificate not found')

    file_path = os.path.join('certificates', file_name)
    ocr_result = extract_text_from_certificate(file_path)
    auto = auto_verify_certificate(file_path, [student_email], event_name)

    certificates.update_one({'file_name': file_name}, {'$set': {'ocr_text': ocr_result['text'], 'ocr_confidence': ocr_result['confidence'], 'auto_verified': auto['verified']}})

    if auto['verified']:
        certificates.update_one({'file_name': file_name}, {'$set': {'verified': True, 'verified_by': user.get('email'), 'verification_comment': 'Auto OCR verified', 'rejection_reason': None}})
        send_notification(student_email, f"Certificate '{file_name}' automatically verified via OCR.")

    return {
        'ocr': ocr_result,
        'auto_verify': auto
    }

@event_router.get('/predict-success/{student_email}')
def get_prediction(student_email: str, user: dict = Depends(check_role('admin', 'hod', 'super_admin', 'faculty'))):
    score = activity_scores.find_one({'student_email': student_email})
    if not score:
        # Default prediction for new students
        prediction = predict_achievement_success(0, 0, 0)
    else:
        participations_count = score.get('participations', 0)
        wins_count = score.get('wins', 0)
        total_points = score.get('total_points', 0)
        avg_points = total_points / participations_count if participations_count > 0 else 0
        
        prediction = predict_achievement_success(participations_count, wins_count, avg_points)
        
    return prediction
