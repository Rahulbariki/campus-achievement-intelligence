import os
from pymongo import MongoClient
from dotenv import load_dotenv
import certifi

# Try to load the URI from the path where I found it.
URI = "mongodb+srv://rahulbariki24_db_user:5wDZoliLtClhMu4c@cluster0.dqdag57.mongodb.net/campus_achievement?retryWrites=true&w=majority&appName=Cluster0"

try:
    print(f"Connecting to {URI}")
    client = MongoClient(URI, tlsCAFile=certifi.where(), serverSelectionTimeoutMS=5000)
    db = client.get_database("campus_achievement")
    print(f"Connected to {db.name}")
    print(f"Collections: {db.list_collection_names()}")
except Exception as e:
    print(f"Connection failed: {e}")
