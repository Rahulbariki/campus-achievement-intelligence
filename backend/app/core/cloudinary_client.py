from datetime import datetime

from backend.app.core.config import settings

try:
    import cloudinary
    import cloudinary.uploader
except ImportError:  # pragma: no cover - runtime dependency guard
    cloudinary = None


class CloudinaryStorage:
    def __init__(self) -> None:
        self.enabled = bool(
            cloudinary
            and settings.cloudinary_cloud_name
            and settings.cloudinary_api_key
            and settings.cloudinary_api_secret
        )
        if self.enabled:
            cloudinary.config(
                cloud_name=settings.cloudinary_cloud_name,
                api_key=settings.cloudinary_api_key,
                api_secret=settings.cloudinary_api_secret,
                secure=True,
            )

    def upload_certificate(self, file_bytes: bytes, filename: str) -> dict[str, str | None]:
        if not self.enabled:
            return {
                "url": f"https://example.com/mock-storage/{filename}",
                "public_id": None,
            }

        public_id = (
            f"caip/certificates/{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{filename}"
        )
        result = cloudinary.uploader.upload(
            file_bytes,
            resource_type="auto",
            public_id=public_id,
            overwrite=False,
        )
        return {
            "url": result["secure_url"],
            "public_id": result["public_id"],
        }


storage = CloudinaryStorage()
