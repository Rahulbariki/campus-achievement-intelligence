import requests

URL = "http://127.0.0.1:8000/api/register"
PAYLOAD = {
    "name": "Test User",
    "email": "test@gmail.com",
    "password": "Password123",
    "department": "CSE",
    "role": "student"
}

try:
    print(f"Post to {URL}")
    response = requests.post(URL, json=PAYLOAD)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Request failed: {e}")
