def _format_achievement(achievement: str) -> str:
    mapping = {
        "participation": "participation",
        "runner_up": "runner-up distinction",
        "finalist": "finalist recognition",
        "winner": "winner title",
    }
    normalized = achievement.strip().lower().replace("-", "_").replace(" ", "_")
    return mapping.get(normalized, normalized.replace("_", " "))


def generate_press_note(
    student_name: str,
    department: str,
    event_name: str,
    achievement: str,
) -> str:
    formatted_achievement = _format_achievement(achievement)

    return (
        f"{student_name} of the {department} department has brought notable distinction to the "
        f"institution by earning {formatted_achievement} in {event_name}. "
        f"The achievement reflects the student's academic discipline, competitive spirit, and "
        f"commitment to excellence, while also underscoring the department's continued emphasis "
        f"on high-impact learning and meaningful student accomplishments. "
        f"The institution congratulates {student_name} on this commendable success and recognizes "
        f"the milestone as a proud moment for the campus community."
    )
