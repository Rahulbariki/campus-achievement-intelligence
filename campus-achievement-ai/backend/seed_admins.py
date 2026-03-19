import bcrypt
from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Load credentials from .env
load_dotenv()

MONGO_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017')

def get_password_hash(password):
    salt = bcrypt.gensalt()
    # Ensure it is bytes
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def seed_super_admins():
    try:
        client = MongoClient(MONGO_URI)
        db = client['campus_achievement']
        users = db['users']

        super_admins = [
            {
                "name": "Rahul Bariki",
                "email": "rahulbariki24@gmail.com",
                "password": get_password_hash("Rahul24$$$$"),
                "role": "super_admin",
                "department": "Founding Editor",
                "year": 4
            },
            {
                "name": "Rahul Bariki (Typosafe)",
                "email": "rahulbarik124@gmail.com",
                "password": get_password_hash("Rahul24$$$$"),
                "role": "super_admin",
                "department": "Founding Editor",
                "year": 4
            },
            {
                "name": "Rahul Bariki",
                "email": "23x51a3302@srecnandyal.edu.in",
                "password": get_password_hash("Rahul24$$$$"),
                "role": "super_admin",
                "department": "Founding Editor",
                "year": 4
            }
        ]

        for admin in super_admins:
            existing = users.find_one({"email": admin["email"]})
            if existing:
                users.replace_one({"email": admin["email"]}, admin)
                print(f"Updated Super Admin: {admin['email']}")
            else:
                users.insert_one(admin)
                print(f"Created Super Admin: {admin['email']}")

        print("--- SEEDING COMPLETE ---")
    except Exception as e:
        print(f"Seeding failed: {e}")

if __name__ == "__main__":
    seed_super_admins()
