from fastapi import APIRouter, Depends, File, Form, UploadFile

from backend.app.api.deps import get_current_user, require_roles
from backend.app.schemas.certificate import CertificateResponse
from backend.app.services.certificate_service import CertificateService

router = APIRouter(tags=["Certificates"])


@router.post("/upload-certificate", response_model=CertificateResponse)
async def upload_certificate(
    file: UploadFile = File(...),
    participation_id: str | None = Form(default=None),
    current_user: dict = Depends(require_roles("student", "faculty", "admin")),
) -> CertificateResponse:
    document = await CertificateService.upload_certificate(
        upload=file,
        current_user=current_user,
        participation_id=participation_id,
    )
    return CertificateResponse(**document)


@router.get("/certificates", response_model=list[CertificateResponse])
def list_certificates(
    current_user: dict = Depends(get_current_user),
) -> list[CertificateResponse]:
    certificates = CertificateService.list_certificates(current_user)
    return [CertificateResponse(**entry) for entry in certificates]


@router.put("/verify-certificate/{certificate_id}", response_model=CertificateResponse)
def verify_certificate(
    certificate_id: str,
    current_user: dict = Depends(require_roles("admin", "hod", "super_admin")),
) -> CertificateResponse:
    return CertificateResponse(
        **CertificateService.verify_certificate(certificate_id, current_user)
    )


@router.delete("/certificate/{certificate_id}", response_model=CertificateResponse)
def delete_certificate(
    certificate_id: str,
    current_user: dict = Depends(get_current_user),
) -> CertificateResponse:
    return CertificateResponse(
        **CertificateService.delete_certificate(certificate_id, current_user)
    )
