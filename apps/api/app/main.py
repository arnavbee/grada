import logging
import re
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core import rate_limit
from app.core.config import get_settings
from app.core.security import TokenError, decode_access_token
from app.db.session import init_db
from app.services.job_queue import start_job_worker, stop_job_worker
from app.services.object_storage import get_object_storage_service

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

settings = get_settings()
logger = logging.getLogger(__name__)

API_ROOT = Path(__file__).resolve().parents[1]
STATIC_DIR = API_ROOT / 'static'
STATIC_DIR.mkdir(parents=True, exist_ok=True)

_COMPANY_SEGMENT = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')

_RATE_LIMITED_AUTH_PATHS = {
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/refresh-token',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/reset-password',
}
_DEMO_PATH = '/api/v1/auth/demo'


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings.validate_for_environment()
    init_db()
    object_storage = get_object_storage_service()
    if settings.is_production and not object_storage.enabled:
        if not settings.allow_ephemeral_storage:
            raise RuntimeError(
                'Refusing to start: object storage (R2_*) is not configured in production, '
                'so uploads and generated documents would be lost on redeploy. '
                'Configure R2_* env vars or set ALLOW_EPHEMERAL_STORAGE=true to override.'
            )
        logger.warning('Object storage disabled in production (ALLOW_EPHEMERAL_STORAGE override in effect).')
    else:
        logger.info('Object storage backend: %s', object_storage.backend)
    start_job_worker()
    try:
        yield
    finally:
        stop_job_worker()


app = FastAPI(title='grada', version='0.1.0', lifespan=lifespan)

origins = [origin.strip() for origin in settings.frontend_origins.split(',') if origin.strip()]
logger.info('Configured CORS origins: %s', origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


def _extract_token(request: Request) -> str | None:
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        return auth_header.removeprefix('Bearer ').strip() or None
    fallback = request.headers.get('x-access-token', '').strip()
    if fallback:
        return fallback.removeprefix('Bearer ').strip() or fallback
    cookie = request.cookies.get('kira_access_token', '').strip()
    return cookie or None


def _static_owner_segment(path: str) -> str | None:
    """Return the company-id path segment for company-partitioned uploads, if any."""
    parts = [part for part in path.split('/') if part]
    # /static/uploads/{cid}/..., /static/uploads/techpacks/{cid}/..., /static/uploads/received-pos/{cid}/...
    if len(parts) >= 3 and parts[0] == 'static' and parts[1] == 'uploads':
        candidate = parts[3] if parts[2] in {'techpacks', 'received-pos'} and len(parts) >= 4 else parts[2]
        if _COMPANY_SEGMENT.match(candidate):
            return candidate
    return None


@app.middleware('http')
async def guard_static_files(request: Request, call_next):
    path = request.url.path
    if path.startswith('/static/'):
        token = _extract_token(request)
        if not token:
            return JSONResponse(status_code=401, content={'detail': 'Authentication required.'})
        try:
            payload = decode_access_token(token)
        except TokenError:
            return JSONResponse(status_code=401, content={'detail': 'Invalid or expired token.'})
        owner = _static_owner_segment(path)
        if owner is not None and owner != payload.get('company_id'):
            return JSONResponse(status_code=404, content={'detail': 'Not found.'})
    return await call_next(request)


@app.middleware('http')
async def enforce_rate_limits(request: Request, call_next):
    if settings.rate_limit_enabled and request.method == 'POST':
        path = request.url.path.rstrip('/')
        rule = None
        if path == _DEMO_PATH:
            rule = 'demo'
        elif path in _RATE_LIMITED_AUTH_PATHS:
            rule = 'auth'
        if rule is not None:
            ip = rate_limit.client_ip(dict(request.headers), request.client.host if request.client else 'unknown')
            if not rate_limit.allow(rule, ip):
                return JSONResponse(
                    status_code=429,
                    content={'detail': 'Too many requests. Please try again in a minute.'},
                    headers={'Retry-After': '60'},
                )
    return await call_next(request)


@app.middleware('http')
async def log_requests(request: Request, call_next):
    logger.info('Incoming Request: %s %s', request.method, request.url)
    try:
        response = await call_next(request)
        logger.info('Request Processed: %s', response.status_code)
        return response
    except Exception:
        logger.exception('Request Failed')
        raise


app.include_router(api_router, prefix='/api/v1')

# Local-disk uploads and generated documents; access is guarded by the
# static-file middleware above (auth required, company-scoped where possible).
app.mount('/static', StaticFiles(directory=str(STATIC_DIR)), name='static')


@app.get('/health', tags=['health'])
def health_check() -> dict[str, str]:
    return {'status': 'ok', 'service': 'api'}
