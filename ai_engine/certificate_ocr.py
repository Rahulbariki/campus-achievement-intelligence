import re

from ai_engine.scoring import normalize_achievement


def extract_certificate_details(filename: str, file_bytes: bytes) -> dict[str, str | float | None]:
    decoded = file_bytes.decode("utf-8", errors="ignore")
    text = f"{filename}\n{decoded}".replace("_", " ")

    name_match = re.search(r"(?:name|student)\s*[:\\-]\s*([A-Za-z ]+)", text, re.IGNORECASE)
    event_match = re.search(
        r"(?:event|competition|hackathon)\s*[:\\-]\s*([A-Za-z0-9& \\-]+)",
        text,
        re.IGNORECASE,
    )

    achievement = None
    lowered = text.lower()
    for candidate in ("winner", "finalist", "runner up", "runner-up", "participation"):
        if candidate in lowered:
            achievement = normalize_achievement(candidate)
            break

    confidence = 0.55
    if name_match:
        confidence += 0.15
    if event_match:
        confidence += 0.15
    if achievement:
        confidence += 0.15

    return {
        "name": name_match.group(1).strip() if name_match else None,
        "event": event_match.group(1).strip() if event_match else None,
        "achievement": achievement,
        "confidence": round(min(confidence, 0.95), 2),
    }
