from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.models.user import User
from app.services.object_storage import get_object_storage_service

router = APIRouter(prefix='/uploads', tags=['uploads'])
settings = get_settings()
object_storage = get_object_storage_service()

UPLOAD_DIR = Path('static/uploads')
TECHPACK_UPLOAD_DIR = UPLOAD_DIR / 'techpacks'
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
TECHPACK_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post('', status_code=201, include_in_schema=False)
@router.post("/", status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    content_type = file.content_type or 'application/octet-stream'
    if not content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail='Only images are allowed')

    # Generate unique filename
    ext = Path(file.filename).suffix
    if not ext:
        ext = '.jpg'  # Default fallback
    
    unique_name = f"{uuid4().hex}{ext}"
    company_id = current_user.company_id
    key = f'uploads/{company_id}/{unique_name}'

    try:
        content = await file.read()
        if object_storage.enabled:
            object_url = object_storage.upload_bytes(key=key, content=content, content_type=content_type)
            if object_url:
                return {'url': object_url, 'filename': unique_name}

        company_upload_dir = UPLOAD_DIR / company_id
        company_upload_dir.mkdir(parents=True, exist_ok=True)
        file_path = company_upload_dir / unique_name
        with open(file_path, 'wb') as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to save file: {e!s}') from e

    return {'url': f'/static/uploads/{company_id}/{unique_name}', 'filename': unique_name}


@router.post('/tech-pack', status_code=201)
@router.post('/tech-pack/', status_code=201, include_in_schema=False)
async def upload_tech_pack(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    content_type = file.content_type or 'application/octet-stream'
    if content_type != 'application/pdf':
        raise HTTPException(status_code=400, detail='Only PDF tech-pack files are allowed.')

    ext = Path(file.filename or '').suffix.lower()
    if ext != '.pdf':
        ext = '.pdf'

    unique_name = f'{uuid4().hex}{ext}'
    company_id = current_user.company_id
    key = f'uploads/{company_id}/techpacks/{unique_name}'

    try:
        content = await file.read()
        if object_storage.enabled:
            object_url = object_storage.upload_bytes(key=key, content=content, content_type=content_type)
            if object_url:
                return {'url': object_url, 'filename': unique_name}

        company_techpack_upload_dir = TECHPACK_UPLOAD_DIR / company_id
        company_techpack_upload_dir.mkdir(parents=True, exist_ok=True)
        file_path = company_techpack_upload_dir / unique_name
        with open(file_path, 'wb') as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to save file: {e!s}') from e

    return {'url': f'/static/uploads/techpacks/{company_id}/{unique_name}', 'filename': unique_name}
