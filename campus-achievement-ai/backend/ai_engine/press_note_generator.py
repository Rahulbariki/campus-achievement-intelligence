import datetime

def generate_press_note(student_name: str, department: str, year: int, event_name: str, organizer: str, achievement: str):
    """
    Generates a professional press note for a student achievement.
    """
    date_str = datetime.date.today().strftime("%B %d, %Y")
    
    achievement_text = achievement.replace("_", " ").title()
    
    note = f"""
PRESS NOTE

Date: {date_str}
Location: Santhiram Engineering College

TOPIC: EXTRAORDINARY ACHIEVEMENT BY {student_name.upper()} IN {event_name.upper()}

A student from Santhiram Engineering College has achieved remarkable success in a prestigious technical event.

Mr./Ms. {student_name} from the Department of {department} (Year {year}) has secured the {achievement_text} position in the '{event_name}' organized by {organizer}. The event witnessed participation from several teams across various institutions.

The innovation and technical excellence displayed by {student_name} impressed the judges and brought recognition to our institution.

The Management, Principal, and Head of the Department congratulated the student for this outstanding achievement and appreciated their dedication and hard work. The college continues to encourage students to actively participate in such technical competitions to enhance their practical knowledge and skills.

---
Issued by:
Public Relations Office
Santhiram Engineering College
"""
    return note.strip()

def generate_social_media_post(student_name: str, department: str, event_name: str, achievement: str):
    achievement_text = achievement.replace("_", " ").title()
    post = f"""
🎉 Proud Moment for Santhiram Engineering College! 🎉

Congratulations to {student_name} from {department} for securing the {achievement_text} position in {event_name}! 🚀

We are incredibly proud of your hard work and achievement. Keep shining! ✨

#SanthiramEngineeringCollege #StudentAchievement #Winner #ProudMoment #{department.replace(' ', '')} #{event_name.replace(' ', '')}
"""
    return post.strip()
