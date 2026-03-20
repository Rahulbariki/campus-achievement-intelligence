import os
from pymongo import MongoClient
import certifi
from dotenv import load_dotenv

load_dotenv()

URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("MONGODB_DB_NAME", "campus_achievement")

print(f"Testing real connection to {URI[:20]}...")
try:
    client = MongoClient(URI, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
    client.admin.command('ping')
    db = client[DB_NAME]
    print(f"Connected to {db.name}!")
    print(f"Collections: {db.list_collection_names()}")
except Exception as e:
    print(f"FAILED to connect to REAL Atlas: {e}")
