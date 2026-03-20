from fastapi import APIRouter, Depends, File, Form, UploadFile, status

from backend.app.api.deps import get_current_user, require_roles
from backend.app.schemas.certificate import CertificateDeleteResponse, CertificateResponse
from backend.app.services.certificate_service import CertificateService

router = APIRouter(tags=["Certificates"])


@router.post("/upload-certificate", response_model=CertificateResponse, status_code=status.HTTP_201_CREATED)
async def upload_certificate(
    student_email: str = Form(...),
    event_name: str = Form(...),
    achievement: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(
        require_roles("student", "faculty", "admin", "hod", "super_admin")
    ),
) -> CertificateResponse:
    document = await CertificateService.upload_certificate(
        upload=file,
        current_user=current_user,
        student_email=student_email,
        event_name=event_name,
        achievement=achievement,
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


@router.delete("/certificate/{certificate_id}", response_model=CertificateDeleteResponse)
def delete_certificate(
    certificate_id: str,
    current_user: dict = Depends(get_current_user),
) -> CertificateDeleteResponse:
    return CertificateDeleteResponse(
        **CertificateService.delete_certificate(certificate_id, current_user)
    )
