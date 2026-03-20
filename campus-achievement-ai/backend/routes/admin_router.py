from fastapi import APIRouter, Depends, HTTPException, status
from routes.security import check_role
from database import certificates, users, participations, press_notes, events
from bson import ObjectId
from datetime import datetime

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
    student = users.find_one({'email': student_email})
    if not student:
        raise HTTPException(status_code=404, detail='Student not found')
    
    participation = participations.find_one({'student_email': student_email, 'event_name': event_name})
    if not participation:
        raise HTTPException(status_code=404, detail='Participation record not found')
    
    event = events.find_one({'event_name': event_name})
    organizer = event.get('organizer', 'the organizers') if event else 'the organizers'
    
    # Lazy import to avoid loading heavy modules at startup
    from ai_engine.press_note_generator import generate_press_note, generate_social_media_post
    
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

@admin_router.get('/department-briefing')
def get_dept_briefing(days: int = 30, user: dict = Depends(check_role('admin', 'hod', 'super_admin'))):
    from datetime import timedelta
    cutoff = datetime.utcnow() - timedelta(days=days)
    
    # Fetch verified certificates in the period
    recent_achievements = list(certificates.find({'verified': True, 'uploaded_at': {'$gte': cutoff}}, {'_id': 0}).sort('uploaded_at', -1))
    
    period_text = f"Last {days} Days"
    if days == 7: period_text = "Last Week"
    elif days == 30: period_text = "This Month"
    elif days == 180: period_text = "Last 6 Months"
    elif days >= 365: period_text = "This Year"

    from ai_engine.press_note_generator import generate_department_briefing
    briefing_text = generate_department_briefing(recent_achievements, period_text)
    
    return {
        'period': period_text,
        'briefing': briefing_text,
        'achievement_count': len(recent_achievements)
    }

from fastapi.responses import Response

@admin_router.get('/export-briefing-pdf')
def export_briefing_pdf(days: int = 30, user: dict = Depends(check_role('admin', 'hod', 'super_admin'))):
    from datetime import timedelta
    cutoff = datetime.utcnow() - timedelta(days=days)
    recent_achievements = list(certificates.find({'verified': True, 'uploaded_at': {'$gte': cutoff}}, {'_id': 0}).sort('uploaded_at', -1))
    
    period_text = f"Last {days} Days"
    if days == 7: period_text = "Last Week"
    elif days == 30: period_text = "This Month"
    elif days == 180: period_text = "Last 6 Months"
    elif days >= 365: period_text = "This Year"

    from ai_engine.press_note_generator import generate_department_briefing
    briefing_text = generate_department_briefing(recent_achievements, period_text)
    
    # Lazy import fpdf
    from fpdf import FPDF
    
    pdf = FPDF()
    pdf.add_page()
    
    # Newspaper Header
    pdf.set_font("Helvetica", "B", 20)
    pdf.cell(0, 15, "THE CAMPUS CHRONICLE", ln=True, align="C")
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 10, "DEPARTMENTAL ACHIEVEMENT BRIEFING", ln=True, align="C")
    pdf.set_font("Helvetica", "I", 9)
    pdf.cell(0, 5, f"Period: {period_text} | Generated: {datetime.now().strftime('%B %d, %Y')}", ln=True, align="C")
    pdf.line(10, 45, 200, 45)
    pdf.ln(15)
    
    # Content
    pdf.set_font("Courier", size=10)
    # Convert text to handle potential encoding issues or special characters if needed
    clean_text = briefing_text.encode('latin-1', 'replace').decode('latin-1')
    pdf.multi_cell(0, 6, clean_text)
    
    # Footer
    pdf.set_y(-30)
    pdf.set_font("Helvetica", "I", 8)
    pdf.cell(0, 10, "Confidential: For Internal Departmental Use Only", ln=True, align="C")
    
    pdf_bytes = pdf.output()
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=HOD_Briefing_{period_text.replace(' ', '_')}.pdf"}
    )
