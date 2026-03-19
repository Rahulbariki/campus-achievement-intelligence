from pymongo import MongoClient
import os
import certifi

# Load environment variables
MONGO_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'campus_achievement')

_client = None

def get_db():
    global _client
    if _client is None:
        try:
            if "mongodb+srv" in MONGO_URI:
                _client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
            else:
                _client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
            _client.admin.command('ping')
        except Exception as e:
            print(f"Database connection failed: {e}")
            import mongomock
            _client = mongomock.MongoClient()
    return _client[DB_NAME]

# Define collections as properties or lazy accessors
class DBProxy:
    def __getitem__(self, name):
        return get_db()[name]

db = DBProxy()

users = db['users']
events = db['events']
participations = db['participations']
certificates = db['certificates']
press_notes = db['press_notes']
audit_logs = db['audit_logs']
notifications = db['notifications']
activity_scores = db['activity_scores']
