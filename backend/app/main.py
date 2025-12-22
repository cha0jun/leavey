from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import users, leaves, finance, audit, webhooks
from app.core.config import settings
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Schema creation and seeding
    from app.core.database import create_db_and_tables
    create_db_and_tables()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Vibe Stack: FastAPI + SQLModel + Clerk + Orval",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENABLE_DOCS else None,
    redoc_url="/redoc" if settings.ENABLE_DOCS else None
)

# --- 1. MIDDLEWARE: CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 2. REGISTER ROUTERS ---
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(leaves.router, prefix="/leaves", tags=["Leaves"])
app.include_router(finance.router, prefix="/finance", tags=["Finance"])
app.include_router(audit.router, prefix="/audit", tags=["Audit"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["Webhooks"])

# --- 3. HEALTH CHECK ---
@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "ok", 
        "environment": settings.ENVIRONMENT,
        "version": settings.VERSION
    }