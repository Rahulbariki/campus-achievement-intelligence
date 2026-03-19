from fastapi import APIRouter, HTTPException, status
from models import UserCreate, LoginRequest
from database import users
from auth import get_password_hash, create_access_token, verify_password

auth_router = APIRouter()

super_admin_allowlist = {
    'rahulbariki24@gmail.com',
    '23x51a3302@gmail.com'
}

DEFAULT_SUPER_ADMIN_PASSWORD = 'SuperPass123!'

@auth_router.post('/register')
def register(user: UserCreate):
    if users.find_one({'email': user.email}):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Email already exists')

    super_admin_allowlist = {
        'rahulbariki24@gmail.com',
        '23x51a3302@gmail.com'
    }

    domain = user.email.split('@')[-1].lower()

    if user.email.lower() in super_admin_allowlist:
        user.role = 'super_admin'

    # allow gmail only for admin/super_admin and srecnandyal only for all
    if domain == 'gmail.com' and user.role not in ['admin', 'super_admin']:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='gmail.com users can only be admin or super_admin')

    if domain not in ['srecnandyal.edu.in', 'srecnandyal.com', 'gmail.com']:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='Only srecnandyal.edu.in or srecnandyal.com users can register (or gmail for admin/super_admin)')

    doc = user.dict()
    doc['password'] = get_password_hash(user.password)
    inserted = users.insert_one(doc)
    return {'message': 'User registered', 'user_id': str(inserted.inserted_id), 'role': doc['role']}


from pydantic import BaseModel


class SeedSuperAdminRequest(BaseModel):
    default_password: str


@auth_router.post('/seed-super-admins')
def seed_super_admins(request: SeedSuperAdminRequest):
    """Create or update special super-admin accounts with a shared default password."""
    super_admin_allowlist = [
        'rahulbariki24@gmail.com',
        '23x51a3302@gmail.com'
    ]

    hashed = get_password_hash(request.default_password)
    results = []

    for email in super_admin_allowlist:
        username = email.split('@')[0]
        user_doc = {
            'name': username,
            'email': email,
            'password': hashed,
            'role': 'super_admin',
            'department': 'Admin',
            'year': None,
            'section': None
        }
        users.update_one({'email': email}, {'$set': user_doc}, upsert=True)
        results.append({'email': email, 'role': 'super_admin'})

    return {'message': 'Super admins seeded/updated', 'accounts': results}

@auth_router.post('/login')
def login(user_credentials: LoginRequest):
    email = user_credentials.email
    password = user_credentials.password

    user = users.find_one({'email': email})
    if not user:
        if email.lower() in super_admin_allowlist:
            # auto bootstrap Rahul super admins with known default password
            users.update_one(
                {'email': email},
                {'$setOnInsert': {
                    'name': email.split('@')[0],
                    'email': email,
                    'password': get_password_hash(DEFAULT_SUPER_ADMIN_PASSWORD),
                    'role': 'super_admin',
                    'department': 'Admin'
                }},
                upsert=True
            )
            if password != DEFAULT_SUPER_ADMIN_PASSWORD:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Wrong password for super_admin (default: SuperPass123!)')
            user = users.find_one({'email': email})
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='User not found')

    if not verify_password(password, user['password']):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Wrong password')

    domain = email.split('@')[-1].lower()
    if domain == 'gmail.com' and user.get('role') not in ['admin', 'super_admin']:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='gmail.com users can only access as admin or super_admin')

    if domain not in ['srecnandyal.edu.in', 'srecnandyal.com', 'gmail.com']:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Only srecnandyal.edu.in or srecnandyal.com students + admin/superadmins are allowed')

    token = create_access_token({'sub': str(user['_id']), 'role': user.get('role', 'student')})
    return {
        'token': token,
        'role': user.get('role', 'student'),
        'userId': str(user['_id']),
        'email': user['email']
    }
