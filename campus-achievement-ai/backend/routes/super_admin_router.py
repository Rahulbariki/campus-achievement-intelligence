from fastapi import APIRouter, Depends, HTTPException, status
from routes.security import check_role
from bson import ObjectId

super_admin_router = APIRouter()

@super_admin_router.get('/collections')
def list_collections(user: dict = Depends(check_role('super_admin'))):
    from database import db
    return db.list_collection_names()

@super_admin_router.get('/db/{collection_name}')
def browse_collection(collection_name: str, user: dict = Depends(check_role('super_admin'))):
    from database import db
    # We allow some restricted collections to be visible too
    names = db.list_collection_names()
    if collection_name not in names:
        raise HTTPException(status_code=404, detail='Collection not found')
    
    docs = list(db[collection_name].find().sort('_id', -1).limit(50))
    for doc in docs:
        doc['_id'] = str(doc['_id'])
    return docs

@super_admin_router.put('/db/{collection_name}/{doc_id}')
def update_document(collection_name: str, doc_id: str, new_data: dict, user: dict = Depends(check_role('super_admin'))):
    from database import db
    if collection_name not in db.list_collection_names():
        raise HTTPException(status_code=404, detail='Collection not found')
    
    # Remove _id from update data if it exists
    new_data.pop('_id', None)
    
    try:
        result = db[collection_name].update_one({'_id': ObjectId(doc_id)}, {'$set': new_data})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail='Document not found')
        return {'message': 'Document updated successfully'}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f'Update failed: {str(e)}')

@super_admin_router.delete('/db/{collection_name}/{doc_id}')
def delete_document(collection_name: str, doc_id: str, user: dict = Depends(check_role('super_admin'))):
    from database import db
    if collection_name not in db.list_collection_names():
        raise HTTPException(status_code=404, detail='Collection not found')
    
    result = db[collection_name].delete_one({'_id': ObjectId(doc_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Document not found')
    return {'message': 'Document deleted successfully'}

@super_admin_router.post('/promote-any')
def promote_any(email: str, role: str, user: dict = Depends(check_role('super_admin'))):
    from database import users
    existing = users.find_one({'email': email})
    if not existing:
        raise HTTPException(status_code=404, detail='User not found')
    users.update_one({'email': email}, {'$set': {'role': role}})
    return {'message': f'User {email} promoted to {role}'}
