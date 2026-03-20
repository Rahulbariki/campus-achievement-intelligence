from ai_engine.scoring import determine_activity_level


def predict_student_outcomes(
    events_participated: int,
    wins: int,
    categories: list[str] | None = None,
    student_name: str | None = None,
) -> dict[str, str | float]:
    categories = categories or []
    participation_signal = min(events_participated / 10, 1)
    win_signal = min(wins / max(events_participated, 1), 1)
    category_signal = min(len(set(categories)) / 5, 1) * 0.1
    probability = min(
        0.2 + (participation_signal * 0.4) + (win_signal * 0.3) + category_signal,
        0.97,
    )
    activity_level = determine_activity_level(events_participated)
    subject = student_name or "This student"

    return {
        "win_probability": round(probability, 2),
        "activity_level": activity_level,
        "summary": (
            f"{subject} is currently classified as {activity_level.lower()} with a projected "
            f"success probability of {round(probability * 100)}% based on participation volume, "
            "historical wins, and category diversity."
        ),
    }
