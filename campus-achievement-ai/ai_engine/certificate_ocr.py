import os
from typing import Dict

try:
    import easyocr
except ImportError:
    easyocr = None


def extract_text_from_certificate(file_path: str) -> Dict[str, object]:
    """Extract text from a certificate image using EasyOCR. Returns text and confidence."""
    if easyocr is None:
        raise RuntimeError('easyocr is not installed. Run pip install easyocr')

    if not os.path.exists(file_path):
        raise FileNotFoundError('Certificate file not found')

    reader = easyocr.Reader(['en'], gpu=False)

    result = reader.readtext(file_path)
    full_text = ' '.join([r[1] for r in result])
    if len(result) > 0:
        avg_confidence = sum([r[2] for r in result]) / len(result)
    else:
        avg_confidence = 0.0

    return {
        'text': full_text,
        'confidence': avg_confidence,
        'segments': [{'bbox': r[0], 'text': r[1], 'confidence': r[2]} for r in result]
    }


def auto_verify_certificate(file_path: str, expected_names: [str], expected_event: str) -> Dict[str, object]:
    text_obj = extract_text_from_certificate(file_path)
    text = text_obj['text'].lower()

    name_found = any(name.lower() in text for name in expected_names)
    event_found = expected_event.lower() in text

    verified = name_found and event_found and text_obj['confidence'] > 0.5

    return {
        'verified': verified,
        'name_found': name_found,
        'event_found': event_found,
        'confidence': text_obj['confidence'],
        'full_text': text
    }
