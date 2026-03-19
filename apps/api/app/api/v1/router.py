from fastapi import APIRouter

from app.api.v1.endpoints.admin import router as admin_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.catalog import router as catalog_router
from app.api.v1.endpoints.uploads import router as uploads_router
from app.api.v1.endpoints.users import router as users_router

api_router = APIRouter()
api_router.include_router(admin_router)
api_router.include_router(auth_router)
api_router.include_router(catalog_router)
api_router.include_router(users_router)
api_router.include_router(uploads_router)


@api_router.get('/health', tags=['health'])
def api_health() -> dict[str, str]:
    return {'status': 'ok', 'service': 'api-v1'}
