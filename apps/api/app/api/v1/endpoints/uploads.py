from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.config import get_settings

router = APIRouter(prefix='/uploads', tags=['uploads'])
settings = get_settings()

UPLOAD_DIR = Path('static/uploads')
TECHPACK_UPLOAD_DIR = UPLOAD_DIR / 'techpacks'
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
TECHPACK_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/", status_code=201)
async def upload_file(file: UploadFile = File(...)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail='Only images are allowed')

    # Generate unique filename
    ext = Path(file.filename).suffix
    if not ext:
        ext = '.jpg'  # Default fallback
    
    unique_name = f"{uuid4().hex}{ext}"
    file_path = UPLOAD_DIR / unique_name

    try:
        content = await file.read()
        with open(file_path, 'wb') as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to save file: {e!s}') from e

    # Generate URL (Assuming localhost for dev, but ideally use full URL)
    # Using relative path for simplicity in MVP, or absolute if needed.
    # Frontend needs full URL to display? API returns path, frontend prepends API_URL?
    # Better: Return full URL if we know the host.
    # For now, return a path that can be served via StaticFiles.
    
    # URL structure: http://localhost:8000/static/uploads/filename
    # settings.frontend_origins doesn't tell us our own host.
    # We'll return the relative path from domain root.
    
    url = f'/static/uploads/{unique_name}'
    
    return {"url": url, "filename": unique_name}


@router.post('/tech-pack', status_code=201)
async def upload_tech_pack(file: UploadFile = File(...)):
    if file.content_type != 'application/pdf':
        raise HTTPException(status_code=400, detail='Only PDF tech-pack files are allowed.')

    ext = Path(file.filename or '').suffix.lower()
    if ext != '.pdf':
        ext = '.pdf'

    unique_name = f'{uuid4().hex}{ext}'
    file_path = TECHPACK_UPLOAD_DIR / unique_name

    try:
        content = await file.read()
        with open(file_path, 'wb') as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Failed to save file: {e!s}') from e

    return {'url': f'/static/uploads/techpacks/{unique_name}', 'filename': unique_name}
