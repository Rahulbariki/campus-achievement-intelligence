from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv('MONGODB_URI')

def cleanup():
    client = MongoClient(MONGO_URI)
    db = client['campus_achievement']
    users = db['users']
    
    # Remove the typo variant identified in the screenshot
    result = users.delete_many({"email": "rahulbarik124@gmail.com"})
    print(f"Removed {result.deleted_count} typo accounts.")

if __name__ == "__main__":
    cleanup()
