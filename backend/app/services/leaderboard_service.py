from collections import defaultdict

from ai_engine.scoring import determine_activity_level
from backend.app.core.database import mongo_manager


class LeaderboardService:
    @staticmethod
    def build_leaderboard(limit: int, current_user: dict) -> list[dict]:
        students = defaultdict(
            lambda: {
                "student_email": "",
                "student_name": "",
                "department": None,
                "total_points": 0,
                "participations": 0,
                "wins": 0,
                "activity_level": "Inactive",
                "last_submission": None,
            }
        )

        query: dict = {}
        if current_user.get("role") in {"faculty", "hod"} and current_user.get("department"):
            query["department"] = current_user["department"]
        elif current_user.get("role") == "student":
            query["student_email"] = current_user["email"]

        for document in mongo_manager.participations.find(query):
            email = document["student_email"]
            entry = students[email]
            entry["student_email"] = email
            entry["student_name"] = document.get("student_name", "Unknown")
            entry["department"] = document.get("department")
            entry["total_points"] += int(document.get("points", 0))
            entry["participations"] += 1
            entry["wins"] += 1 if document.get("achievement") == "winner" else 0
            entry["activity_level"] = determine_activity_level(entry["participations"])
            entry["last_submission"] = document.get("created_at")

        leaderboard = sorted(
            students.values(),
            key=lambda item: (
                item["total_points"],
                item["wins"],
                item["participations"],
            ),
            reverse=True,
        )[:limit]

        for entry in leaderboard:
            mongo_manager.scores.update_one(
                {"student_email": entry["student_email"]},
                {"$set": entry},
                upsert=True,
            )

        return leaderboard

    @staticmethod
    def build_activity_status(current_user: dict) -> list[dict]:
        query = {"role": "student"}
        if current_user.get("role") in {"faculty", "hod"} and current_user.get("department"):
            query["department"] = current_user["department"]

        entries: list[dict] = []
        for student in mongo_manager.users.find(query).sort("name", 1):
            participation_count = mongo_manager.participations.count_documents(
                {"student_email": student["email"]}
            )
            entries.append(
                {
                    "student_email": student["email"],
                    "student_name": student["name"],
                    "department": student.get("department"),
                    "participations": participation_count,
                    "activity_level": determine_activity_level(participation_count),
                }
            )
        return entries
