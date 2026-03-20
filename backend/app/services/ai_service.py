from ai_engine.achievement_predictor import predict_student_outcomes
from ai_engine.certificate_ocr import extract_certificate_details
from ai_engine.press_note_generator import generate_press_note
from backend.app.schemas.ai import PredictionRequest, PressNoteRequest


class AIService:
    @staticmethod
    def extract_certificate(filename: str, file_bytes: bytes) -> dict:
        return extract_certificate_details(filename=filename, file_bytes=file_bytes)

    @staticmethod
    def generate_press_note(payload: PressNoteRequest) -> str:
        return generate_press_note(payload.dict())

    @staticmethod
    def predict_achievement(payload: PredictionRequest) -> dict:
        return predict_student_outcomes(
            events_participated=payload.events_participated,
            wins=payload.wins,
            categories=payload.categories,
            student_name=payload.student_name,
        )
