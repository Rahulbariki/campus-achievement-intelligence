import io
import os
import re
from functools import lru_cache
from statistics import mean
from typing import Any

from ai_engine.scoring import normalize_achievement

ACHIEVEMENT_PATTERNS = (
    (re.compile(r"\bwinner\b", re.IGNORECASE), "winner"),
    (re.compile(r"\bfinalist\b", re.IGNORECASE), "finalist"),
    (re.compile(r"\brunner[\s-]?up\b", re.IGNORECASE), "runner_up"),
    (re.compile(r"\bparticipation\b|\bparticipant\b|\bparticipated\b", re.IGNORECASE), "participation"),
)

EVENT_KEYWORDS = (
    "hackathon",
    "workshop",
    "seminar",
    "conference",
    "symposium",
    "competition",
    "contest",
    "event",
    "challenge",
    "fest",
    "summit",
    "meet",
    "expo",
)

NAME_STOPWORDS = {
    "certificate",
    "achievement",
    "department",
    "college",
    "university",
    "event",
    "competition",
    "workshop",
    "hackathon",
    "winner",
    "finalist",
    "runner",
    "participation",
    "student",
    "name",
    "organizer",
}


def extract_certificate_details(filename: str, file_bytes: bytes) -> dict[str, Any]:
    raw_text, ocr_confidence = _extract_text(filename, file_bytes)
    student_name = _extract_student_name(raw_text)
    event_name = _extract_event_name(raw_text)
    achievement = _extract_achievement(raw_text)
    confidence = _calculate_confidence(
        ocr_confidence=ocr_confidence,
        student_name=student_name,
        event_name=event_name,
        achievement=achievement,
        raw_text=raw_text,
    )

    return {
        "student_name": student_name,
        "event_name": event_name,
        "achievement": achievement,
        "confidence": confidence,
        "raw_text": raw_text,
        "name": student_name,
        "event": event_name,
    }


def _extract_text(filename: str, file_bytes: bytes) -> tuple[str, float]:
    extension = os.path.splitext(filename or "")[1].lower()
    if extension == ".pdf":
        return _extract_text_from_pdf(file_bytes)
    return _extract_text_from_image(file_bytes)


def _extract_text_from_image(file_bytes: bytes) -> tuple[str, float]:
    image = _load_image(file_bytes)
    return _run_easyocr(image)


def _extract_text_from_pdf(file_bytes: bytes) -> tuple[str, float]:
    try:
        import fitz
    except ImportError as exc:  # pragma: no cover - runtime dependency guard
        raise RuntimeError(
            "PyMuPDF is required for PDF OCR. Install pymupdf alongside easyocr."
        ) from exc

    document = fitz.open(stream=file_bytes, filetype="pdf")
    all_lines: list[str] = []
    confidences: list[float] = []

    try:
        for page_index in range(min(document.page_count, 5)):
            page = document.load_page(page_index)
            embedded_text = page.get_text("text").strip()
            if embedded_text:
                all_lines.append(embedded_text)

            pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
            image = _load_image(pixmap.tobytes("png"))
            page_text, page_confidence = _run_easyocr(image)
            if page_text:
                all_lines.append(page_text)
            if page_confidence > 0:
                confidences.append(page_confidence)
    finally:
        document.close()

    combined_text = _clean_text("\n".join(part for part in all_lines if part))
    confidence = round(mean(confidences), 2) if confidences else 0.0
    return combined_text, confidence


def _load_image(file_bytes: bytes):
    try:
        import numpy as np
        from PIL import Image
    except ImportError as exc:  # pragma: no cover - runtime dependency guard
        raise RuntimeError(
            "Pillow and numpy are required for image OCR. Install pillow and numpy."
        ) from exc

    image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    return np.array(image)


@lru_cache(maxsize=1)
def _get_reader():
    try:
        import easyocr
    except ImportError as exc:  # pragma: no cover - runtime dependency guard
        raise RuntimeError("EasyOCR is not installed. Install easyocr to enable OCR.") from exc

    return easyocr.Reader(["en"], gpu=False)


def _run_easyocr(image) -> tuple[str, float]:
    results = _get_reader().readtext(image, detail=1, paragraph=True)
    texts: list[str] = []
    confidences: list[float] = []

    for result in results:
        if len(result) != 3:
            continue
        _, text, confidence = result
        cleaned = text.strip()
        if cleaned:
            texts.append(cleaned)
            confidences.append(float(confidence))

    combined_text = _clean_text("\n".join(texts))
    average_confidence = round(mean(confidences), 2) if confidences else 0.0
    return combined_text, average_confidence


def _clean_text(text: str) -> str:
    normalized_lines = []
    for line in text.splitlines():
        cleaned = " ".join(line.split()).strip()
        if cleaned:
            normalized_lines.append(cleaned)
    return "\n".join(normalized_lines)


def _extract_student_name(text: str) -> str | None:
    for pattern in (
        r"(?:awarded to|presented to|certifies that|this is to certify that)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,4})",
        r"(?:student name|name|student)\s*[:\-]\s*([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,4})",
    ):
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()

    lines = [line.strip() for line in text.splitlines() if line.strip()]
    for index, line in enumerate(lines):
        lowered = line.lower()
        if any(trigger in lowered for trigger in ("awarded to", "presented to", "certify")):
            if index + 1 < len(lines):
                candidate = lines[index + 1].strip(":- ")
                if _looks_like_name(candidate):
                    return candidate

    candidates = [line for line in lines if _looks_like_name(line)]
    return candidates[0] if candidates else None


def _extract_event_name(text: str) -> str | None:
    for pattern in (
        r"(?:event|competition|hackathon|workshop|seminar|conference|contest|challenge)\s*[:\-]\s*([A-Za-z0-9&,\- ]{3,160})",
        r"(?:in|at|during|for)\s+(?:the\s+)?([A-Z][A-Za-z0-9&,\- ]{3,160}(?:"
        + "|".join(keyword.title() for keyword in EVENT_KEYWORDS)
        + r"))",
    ):
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip(" .:-")

    for line in text.splitlines():
        lowered = line.lower()
        if any(keyword in lowered for keyword in EVENT_KEYWORDS):
            cleaned = line.strip(" .:-")
            if len(cleaned) >= 4:
                return cleaned
    return None


def _extract_achievement(text: str) -> str | None:
    for pattern, label in ACHIEVEMENT_PATTERNS:
        if pattern.search(text):
            return normalize_achievement(label)
    return None


def _looks_like_name(value: str) -> bool:
    words = [word for word in value.replace(".", " ").split() if word]
    if not 2 <= len(words) <= 4:
        return False
    if any(any(char.isdigit() for char in word) for word in words):
        return False
    if any(word.lower() in NAME_STOPWORDS for word in words):
        return False
    return all(word[0].isupper() and word.replace("'", "").isalpha() for word in words)


def _calculate_confidence(
    ocr_confidence: float,
    student_name: str | None,
    event_name: str | None,
    achievement: str | None,
    raw_text: str,
) -> float:
    coverage_score = sum(
        field is not None for field in (student_name, event_name, achievement)
    ) / 3
    text_bonus = 0.08 if len(raw_text.split()) >= 15 else 0.0
    confidence = (ocr_confidence * 0.55) + (coverage_score * 0.35) + text_bonus
    return round(max(0.0, min(confidence, 0.99)), 2)
