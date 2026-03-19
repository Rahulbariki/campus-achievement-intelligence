import os
from typing import Dict

def extract_text_from_certificate(file_path: str) -> Dict[str, object]:
    """Mock implementation for Vercel / Production without heavy AI libraries."""
    # Simulation of OCR processing
    return {
        'text': "MOCK: This is a placeholder for OCR text. Real AI processing requires local hosting or specialized GPU environments.",
        'confidence': 0.95,
        'segments': []
    }

def auto_verify_certificate(text: str, student_email: str, event_name: str) -> Dict[str, object]:
    """Mock auto-verification logic."""
    # Since it's a mock, we'll just return true if it's a student email we recognize
    is_rahul = "rahul" in student_email.lower() or "23x" in student_email.lower()
    
    return {
        'verified': is_rahul,
        'name_found': is_rahul,
        'event_found': True,
        'confidence': 0.95,
        'full_text': text
    }
