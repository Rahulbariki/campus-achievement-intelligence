import os
import bcrypt
from pymongo import MongoClient
import certifi
from dotenv import load_dotenv

load_dotenv()

URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("MONGODB_DB_NAME", "campus_achievement")
EMAIL = "rahulbariki24@gmail.com"
NEW_PASSWORD = "Rahul123"

def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")

print(f"Connecting to Atlas for password reset...")
try:
    client = MongoClient(URI, tlsCAFile=certifi.where())
    db = client[DB_NAME]
    users = db.users
    
    new_hash = hash_password(NEW_PASSWORD)
    result = users.update_one(
        {"email": EMAIL.strip().lower()},
        {"$set": {"password_hash": new_hash}}
    )
    
    if result.matched_count > 0:
        print(f"SUCCESS: Password for {EMAIL} has been reset to {NEW_PASSWORD}")
    else:
        print(f"FAILED: No user found with email {EMAIL}")
except Exception as e:
    print(f"ERROR: {e}")
