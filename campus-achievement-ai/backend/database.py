from pymongo import MongoClient
import os
import socket

MONGO_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'campus_achievement')

try:
    host = MONGO_URI.split('//')[1].split(':')[0]
    port = int(MONGO_URI.split(':')[-1])
except:
    host, port = 'localhost', 27017

def is_mongo_running(host=host, port=port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1)
        try:
            s.connect((host, port))
            return True
        except:
            return False

if is_mongo_running():
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    print("Connected to MongoDB")
else:
    import mongomock
    client = mongomock.MongoClient()
    print("MongoDB not found. Using mongomock for testing.")

db = client[DB_NAME]

users = db['users']
events = db['events']
participations = db['participations']
certificates = db['certificates']
press_notes = db['press_notes']
audit_logs = db['audit_logs']
notifications = db['notifications']
activity_scores = db['activity_scores']

