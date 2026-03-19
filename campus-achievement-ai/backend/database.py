from pymongo import MongoClient
import os
import certifi

# Load environment variables
MONGO_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'campus_achievement')

try:
    # Use certifi for Atlas connection verification if needed
    if "mongodb+srv" in MONGO_URI:
        client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
    else:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    
    # Simple check to confirm connection
    client.admin.command('ping')
    print("Database session established with Atlas Cloud")
except Exception as e:
    print(f"Cloud connection failed: {e}")
    try:
        # Local fallback if cloud fails (for local development)
        client = MongoClient('mongodb://localhost:27017', serverSelectionTimeoutMS=2000)
        client.admin.command('ping')
        print("Using local MongoDB fallback")
    except:
        import mongomock
        client = mongomock.MongoClient()
        print("Using in-memory mongomock for testing")

db = client[DB_NAME]

users = db['users']
events = db['events']
participations = db['participations']
certificates = db['certificates']
press_notes = db['press_notes']
audit_logs = db['audit_logs']
notifications = db['notifications']
activity_scores = db['activity_scores']
