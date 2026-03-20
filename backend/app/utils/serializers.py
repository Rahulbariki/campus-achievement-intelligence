from bson import ObjectId


def serialize_document(document: dict | None) -> dict:
    if document is None:
        return {}

    serialized: dict = {}
    for key, value in document.items():
        output_key = "id" if key == "_id" else key
        serialized[output_key] = str(value) if isinstance(value, ObjectId) else value
    return serialized
