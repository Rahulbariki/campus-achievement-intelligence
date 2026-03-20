def generate_press_note(payload: dict) -> str:
    name = payload.get("name", "The student")
    department = payload.get("department", "the department")
    event = payload.get("event", "the event")
    achievement = payload.get("achievement", "a notable position")

    return (
        f"{name} from {department} secured {achievement} in {event}, reflecting the "
        "institution's continued focus on innovation, collaboration, and excellence in "
        "student achievement. The accomplishment strengthens the campus reputation for "
        "turning classroom effort into measurable outcomes."
    )
