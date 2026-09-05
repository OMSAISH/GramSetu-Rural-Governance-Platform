import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db, AsyncSessionLocal
from app.seed import seed_data
from app.services.sla_service import sla_service
from app.routers import (
    auth_router,
    schemes_router,
    grievances_router,
    governance_router,
    chat_router,
    analytics_router,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("GramSetu")

async def background_sla_monitor():
    """Periodic task checking and escalating overdue grievances."""
    while True:
        try:
            await asyncio.sleep(300) # Check every 5 minutes
            async with AsyncSessionLocal() as session:
                escalated = await sla_service.check_and_escalate_overdue_grievances(session)
                if escalated > 0:
                    logger.info(f"[SLA Monitor] Escalated {escalated} overdue grievances.")
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"[SLA Monitor Error] {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Initializing GramSetu database and seed data...")
    await init_db()
    try:
        await seed_data()
    except Exception as e:
        logger.error(f"Error during database seed: {e}")

    # Start SLA monitor
    monitor_task = asyncio.create_task(background_sla_monitor())
    yield
    # Shutdown
    monitor_task.cancel()
    try:
        await monitor_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="GramSetu API",
    description="Multilingual Gram Panchayat Governance, Scheme Entitlement & Grievance Assistant",
    version="1.0.0",
    lifespan=lifespan
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(schemes_router, prefix=settings.API_V1_STR)
app.include_router(grievances_router, prefix=settings.API_V1_STR)
app.include_router(governance_router, prefix=settings.API_V1_STR)
app.include_router(chat_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "app": "GramSetu API",
        "status": "online",
        "version": "1.0.0",
        "description": "Multilingual Gram Panchayat Governance, Scheme Entitlement & Grievance Assistant",
        "docs_url": "/docs",
        "languages_supported": ["en", "hi", "mr"]
    }

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": "2026-09-05T23:45:00Z"}
