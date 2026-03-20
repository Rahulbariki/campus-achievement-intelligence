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
    event_photo: UploadFile = File(None),
    user: dict = Depends(check_role('student', 'admin', 'hod', 'super_admin'))
):
    if user.get('role') != 'student' and user.get('role') not in ['admin', 'hod', 'super_admin']:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only student/admin/hod/super_admin can upload certificates')

    CERT_DIR = '/tmp/certificates' if os.environ.get('VERCEL') else 'certificates'
    os.makedirs(CERT_DIR, exist_ok=True)

    # 1. Upload Certificate
    safe_name = os.path.basename(file.filename)
    unique_name = f"{uuid.uuid4().hex}_{safe_name}"
    file_path = os.path.join(CERT_DIR, unique_name)
    with open(file_path, 'wb') as buffer:
        shutil.copyfileobj(file.file, buffer)

    cloud_url = None
    try:
        upload_result = cloudinary.uploader.upload(file_path, folder="campus_certificates")
        cloud_url = upload_result.get('secure_url')
    except Exception as e:
        print(f"Cloudinary (Cert) upload failed: {e}")

    # 2. Optional Event Photo Upload
    photo_url = None
    if event_photo:
        photo_name = f"photo_{uuid.uuid4().hex}_{os.path.basename(event_photo.filename)}"
        photo_path = os.path.join(CERT_DIR, photo_name)
        with open(photo_path, 'wb') as buffer:
            shutil.copyfileobj(event_photo.file, buffer)
        try:
            photo_result = cloudinary.uploader.upload(photo_path, folder="event_photos")
            photo_url = photo_result.get('secure_url')
        except Exception as e:
            print(f"Cloudinary (Photo) upload failed: {e}")

    certificates.insert_one({
        'student_email': student_email,
        'event_name': event_name,
        'achievement': achievement,
        'file_name': unique_name,
        'original_file_name': safe_name,
        'cloudinary_url': cloud_url,
        'event_photo_url': photo_url,
        'verified': False,
        'uploaded_at': datetime.utcnow()
    })

    audit_logs.insert_one({
        'action': 'upload_certificate',
        'file_name': file.filename,
        'user': user.get('email'),
        'timestamp': datetime.utcnow()
    })

    return {'message': 'Certificate uploaded successfully', 'url': cloud_url, 'photo_url': photo_url}

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

from datetime import datetime, timedelta

@event_router.get('/activity-ranking')
def get_activity_ranking(days: int = None, user: dict = Depends(check_role('admin', 'hod', 'super_admin'))):
    if days:
        # Filter based on uploaded certificates in the last X days
        cutoff = datetime.utcnow() - timedelta(days=days)
        # Aggregate manually for the filtered period
        pipeline = [
            {'$match': {'verified': True, 'uploaded_at': {'$gte': cutoff}}},
            {'$group': {
                '_id': '$student_email',
                'total_points': {'$sum': {'$cond': [
                    {'$eq': ['$achievement', 'winner']}, 100,
                    {'$cond': [{'$eq': ['$achievement', 'runner_up']}, 50,
                    {'$cond': [{'$eq': ['$achievement', 'finalist']}, 70, 20]}]}
                ]}},
                'participations': {'$sum': 1},
                'wins': {'$sum': {'$cond': [{'$eq': ['$achievement', 'winner']}, 1, 0]}}
            }},
            {'$project': {
                'student_email': '$_id',
                'total_points': 1,
                'participations': 1,
                'wins': 1,
                '_id': 0
            }},
            {'$sort': {'total_points': -1}}
        ]
        results = list(certificates.aggregate(pipeline))
        return results
    
    # Default: Return all-time scores from activity_scores collection
    ranking = list(activity_scores.find({}, {'_id': 0}).sort('total_points', -1))
    return ranking

@event_router.get('/activity-status')
def get_activity_status(days: int = None, user: dict = Depends(check_role('admin', 'hod', 'super_admin'))):
    query = {}
    if days:
        cutoff = datetime.utcnow() - timedelta(days=days)
        query = {'uploaded_at': {'$gte': cutoff}, 'verified': True}
        
        # We need a dynamic count of participations per student for this period
        pipeline = [
            {'$match': query},
            {'$group': {'_id': '$student_email', 'count': {'$sum': 1}}}
        ]
        counts = {item['_id']: item['count'] for item in certificates.aggregate(pipeline)}
        
        # Categorize
        highly_active = [email for email, c in counts.items() if c >= 5]
        moderate = [email for email, c in counts.items() if 2 <= c < 5]
        inactive = [email for email, c in counts.items() if c < 2]
        # Note: 'inactive' here only includes those who participated < 2 times. 
        # Truly inactive (0 participations) won't show in the aggregate unless we cross-ref with users.
    else:
        # Use existing logic from activity_scores
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

    return {
        'highly_active': highly_active,
        'moderate': moderate,
        'inactive': inactive,
        'counts': {
            'highly_active': len(highly_active),
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
    # 4. OCR / AI Verification (Lazy Import for Serverless Performance)
    ocr_result = {'text': '', 'confidence': 0}
    auto_verified_status = {'verified': False}
    try:
        from ai_engine.certificate_ocr import extract_text_from_certificate, auto_verify_certificate
        ocr_result = extract_text_from_certificate(file_path)
        auto_verified_status = auto_verify_certificate(ocr_result['text'], student_email, event_name)
    except Exception as e:
        print(f"OCR failed or skipped: {e}")

    certificates.update_one({'file_name': file_name}, {'$set': {'ocr_text': ocr_result['text'], 'ocr_confidence': ocr_result['confidence'], 'auto_verified': auto_verified_status['verified']}})

    if auto_verified_status['verified']:
        certificates.update_one({'file_name': file_name}, {'$set': {'verified': True, 'verified_by': user.get('email'), 'verification_comment': 'Auto OCR verified', 'rejection_reason': None}})
        send_notification(student_email, f"Certificate '{file_name}' automatically verified via OCR.")

    return {
        'ocr': ocr_result,
        'auto_verify': auto_verified_status
    }

@event_router.get('/predict-success/{student_email}')
def get_prediction(student_email: str, user: dict = Depends(check_role('admin', 'hod', 'super_admin', 'faculty'))):
    score = activity_scores.find_one({'student_email': student_email})
    if not score:
        # Default prediction
        # 5. Predict success (Lazy Import)
        prediction = {'prediction': 'unknown', 'confidence': 0} # Default prediction
        try:
            from ai_engine.achievement_predictor import predict_achievement_success
            prediction = predict_achievement_success(0, 0, 0) # For new students, use default values
        except Exception as e:
            print(f"Prediction skipped: {e}")
    else:
        participations_count = score.get('participations', 0)
        wins_count = score.get('wins', 0)
        total_points = score.get('total_points', 0)
        avg_points = total_points / participations_count if participations_count > 0 else 0
        
        prediction = predict_achievement_success(participations_count, wins_count, avg_points)
        
    return prediction

from fastapi.responses import Response
from fpdf import FPDF

@event_router.get('/export-portfolio-pdf')
def export_portfolio_pdf(user: dict = Depends(get_current_user)):
    # 1. Fetch Student Info
    from database import users
    student = users.find_one({'email': user.get('email')}, {'_id': 0, 'password': 0})
    if not student:
        raise HTTPException(status_code=404, detail='Student not found')

    # 2. Fetch Verified Certificates
    items = list(certificates.find({'student_email': user.get('email'), 'verified': True}, {'_id': 0}).sort('uploaded_at', -1))
    
    # 3. Fetch Score
    score = activity_scores.find_one({'student_email': user.get('email')}, {'_id': 0})
    points = score.get('total_points', 0) if score else 0

    # 4. Generate PDF
    pdf = FPDF()
    pdf.add_page()
    
    # Branding Header
    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 15, "CAMPUS ACHIEVEMENT INTELLIGENCE", ln=True, align="C")
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 10, "OFFICIAL PERFORMANCE TRANSCRIPT", ln=True, align="C")
    pdf.line(10, 35, 200, 35)
    pdf.ln(10)
    
    # Student Details
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(40, 7, "NAME:", 0, 0); pdf.set_font("Helvetica", "", 11); pdf.cell(0, 7, student.get('name', 'N/A').upper(), 0, 1)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(40, 7, "EMAIL:", 0, 0); pdf.set_font("Helvetica", "", 11); pdf.cell(0, 7, student.get('email', 'N/A'), 0, 1)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(40, 7, "DEPARTMENT:", 0, 0); pdf.set_font("Helvetica", "", 11); pdf.cell(0, 7, student.get('department', 'N/A'), 0, 1)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(40, 7, "MERIT POINTS:", 0, 0); pdf.set_font("Helvetica", "B", 11); pdf.cell(0, 7, str(points), 0, 1)
    pdf.ln(10)

    # Achievements Table
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 10, "VERIFIED ACADEMIC & TECHNICAL ACHIEVEMENTS", ln=True)
    pdf.ln(2)
    
    pdf.set_font("Helvetica", "B", 10)
    pdf.set_fill_color(240, 240, 240)
    pdf.cell(100, 8, " EVENT NAME", 1, 0, 'L', True)
    pdf.cell(38, 8, " ACHIEVEMENT", 1, 0, 'C', True)
    pdf.cell(52, 8, " DATE VERIFIED", 1, 1, 'C', True)
    
    pdf.set_font("Helvetica", "", 9)
    for cert in items:
        pdf.cell(100, 8, f" {cert['event_name'].upper()[:50]}", 1)
        pdf.cell(38, 8, cert['achievement'].replace('_', ' ').title(), 1, 0, 'C')
        pdf.cell(52, 8, cert['uploaded_at'].strftime('%Y-%m-%d') if isinstance(cert['uploaded_at'], datetime) else str(cert['uploaded_at'])[:10], 1, 1, 'C')

    if not items:
        pdf.cell(190, 8, "No verified achievements found in the record.", 1, 1, 'C')

    # Legal Disclaimer
    pdf.set_y(-30)
    pdf.set_font("Helvetica", "I", 8)
    # Handle latin-1 encoding for special chars
    disclaimer = "This is a computer-generated document verified by the Campus Achievement Intelligence System. It serves as an official proof of extracurricular and technical participation for the mentioned student."
    pdf.multi_cell(0, 5, disclaimer.encode('latin-1', 'replace').decode('latin-1'), 0, 'C')
    
    pdf_bytes = pdf.output()
    filename = f"Portfolio_{student.get('name', 'Student').replace(' ', '_')}.pdf"
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
