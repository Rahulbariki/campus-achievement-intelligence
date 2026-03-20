POINT_MAP = {
    "participation": 20,
    "runner_up": 50,
    "finalist": 70,
    "winner": 100,
}

ACHIEVEMENT_ALIASES = {
    "runner-up": "runner_up",
    "runner up": "runner_up",
    "participant": "participation",
    "participated": "participation",
}


def normalize_achievement(achievement: str) -> str:
    cleaned = achievement.strip().lower().replace("-", " ")
    cleaned = " ".join(cleaned.split())
    normalized = ACHIEVEMENT_ALIASES.get(cleaned, cleaned)
    return normalized.replace(" ", "_")


def calculate_points(achievement: str) -> int:
    return POINT_MAP.get(normalize_achievement(achievement), 0)


def determine_activity_level(event_count: int) -> str:
    if event_count >= 5:
        return "Highly Active"
    if 2 <= event_count <= 4:
        return "Moderate"
    return "Inactive"
