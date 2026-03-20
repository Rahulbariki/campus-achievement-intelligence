from ai_engine.scoring import determine_activity_level
from backend.app.core.database import mongo_manager
from backend.app.services.score_service import ScoreService
from backend.app.utils.serializers import serialize_document


class LeaderboardService:
    @staticmethod
    def build_leaderboard(limit: int, current_user: dict) -> list[dict]:
        query: dict = {}
        role = current_user.get("role")
        if role in {"faculty", "hod"} and current_user.get("department"):
            query["department"] = current_user["department"]
        elif role == "student":
            query["student_email"] = current_user["email"]

        cursor = (
            mongo_manager.scores.find(query)
            .sort(ScoreService.SORT_ORDER)
            .limit(limit)
        )
        return [
            {
                "student_email": entry.get("student_email"),
                "student_name": entry.get("student_name", "Unknown"),
                "department": entry.get("department"),
                "total_points": int(entry.get("total_points", 0)),
                "participations": int(entry.get("participations_count", 0)),
                "wins": int(entry.get("wins_count", 0)),
                "activity_level": entry.get("activity_level")
                or determine_activity_level(int(entry.get("participations_count", 0))),
                "last_submission": entry.get("last_participation_at"),
            }
            for entry in map(serialize_document, cursor)
        ]

    @staticmethod
    def build_activity_status(current_user: dict) -> list[dict]:
        query = {"role": "student"}
        role = current_user.get("role")
        if role in {"faculty", "hod"} and current_user.get("department"):
            query["department"] = current_user["department"]
        elif role == "student":
            query["email"] = current_user["email"]

        students = list(mongo_manager.users.find(query).sort("name", 1))
        if not students:
            return []

        emails = [student["email"] for student in students]
        score_map = {
            score["student_email"]: score
            for score in mongo_manager.scores.find({"student_email": {"$in": emails}})
        }

        entries: list[dict] = []
        for student in students:
            score = score_map.get(student["email"], {})
            participations = int(score.get("participations_count", 0))
            entries.append(
                {
                    "student_email": student["email"],
                    "student_name": student["name"],
                    "department": student.get("department"),
                    "participations": participations,
                    "activity_level": score.get("activity_level")
                    or determine_activity_level(participations),
                }
            )
        return entries
