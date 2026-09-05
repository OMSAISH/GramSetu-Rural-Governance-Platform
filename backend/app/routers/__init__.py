from app.routers.auth import router as auth_router
from app.routers.schemes import router as schemes_router
from app.routers.grievances import router as grievances_router
from app.routers.governance import router as governance_router
from app.routers.chat import router as chat_router
from app.routers.analytics import router as analytics_router

__all__ = [
    "auth_router",
    "schemes_router",
    "grievances_router",
    "governance_router",
    "chat_router",
    "analytics_router",
]
