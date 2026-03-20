from pymongo import ASCENDING, DESCENDING, MongoClient

from backend.app.core.config import settings


class MongoManager:
    def __init__(self) -> None:
        self._client: MongoClient | None = None

    @property
    def client(self) -> MongoClient:
        if self._client is None:
            self._client = MongoClient(settings.mongodb_uri)
        return self._client

    @property
    def db(self):
        return self.client[settings.mongodb_db_name]

    @property
    def users(self):
        return self.db["users"]

    @property
    def events(self):
        return self.db["events"]

    @property
    def participations(self):
        return self.db["participations"]

    @property
    def certificates(self):
        return self.db["certificates"]

    @property
    def scores(self):
        return self.db["scores"]

    @property
    def press_notes(self):
        return self.db["press_notes"]

    def ensure_indexes(self) -> None:
        self.users.create_index("email", unique=True)
        self.users.create_index([("role", ASCENDING), ("department", ASCENDING)])

        self.events.create_index([("date", ASCENDING)])
        self.events.create_index([("created_by_user_id", ASCENDING)])
        self.events.create_index([("department", ASCENDING), ("status", ASCENDING)])

        self.participations.create_index(
            [("student_email", ASCENDING), ("event_id", ASCENDING)],
            unique=True,
        )
        self.participations.create_index([("student_user_id", ASCENDING)])
        self.participations.create_index([("event_id", ASCENDING)])
        self.participations.create_index([("achievement", ASCENDING), ("status", ASCENDING)])

        self.certificates.create_index([("student_email", ASCENDING)])
        self.certificates.create_index([("student_email", ASCENDING), ("verification_status", ASCENDING)])
        self.certificates.create_index([("event_name", ASCENDING)])
        self.certificates.create_index([("achievement", ASCENDING)])
        self.certificates.create_index([("verification_status", ASCENDING)])

        self.scores.create_index("student_email", unique=True)
        self.scores.create_index([("student_user_id", ASCENDING)])
        self.scores.create_index([("activity_level", ASCENDING), ("total_points", ASCENDING)])
        self.scores.create_index(
            [("department", ASCENDING), ("total_points", DESCENDING), ("wins_count", DESCENDING)]
        )

        self.press_notes.create_index([("student_user_id", ASCENDING)])
        self.press_notes.create_index([("student_name", ASCENDING)])
        self.press_notes.create_index([("event_name", ASCENDING)])
        self.press_notes.create_index([("generated_by_user_id", ASCENDING)])
        self.press_notes.create_index([("event_id", ASCENDING)])
        self.press_notes.create_index([("status", ASCENDING), ("created_at", ASCENDING)])


mongo_manager = MongoManager()
