import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.security import TokenError, decode_access_token
from app.db.session import init_db
from app.services.job_queue import start_job_worker, stop_job_worker

settings = get_settings()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
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


@app.middleware('http')
async def attach_auth_payload(request: Request, call_next):
    request.state.auth_payload = None
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header.removeprefix('Bearer ').strip()
        try:
            request.state.auth_payload = decode_access_token(token)
        except TokenError:
            request.state.auth_payload = None
    response = await call_next(request)
    return response


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

# Mount static files for local uploads
app.mount("/static", StaticFiles(directory="static"), name="static")



@app.get('/health', tags=['health'])
def health_check() -> dict[str, str]:
    return {'status': 'ok', 'service': 'api'}
