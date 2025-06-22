from fastapi import APIRouter
from .routes import api_router as main_router

# Create main API router
api_router = APIRouter()

# Include all route modules
api_router.include_router(main_router, tags=["LegalLink AI"])

__all__ = ["api_router"]
