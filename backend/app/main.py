from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import the routers from the modules we created
from app.routers import users, leaves, finance, audit, webhooks

from contextlib import asynccontextmanager
from app.core.database import create_db_and_tables

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(
    title="Government Leave Portal API",
    version="1.0.0",
    description="Vibe Stack: FastAPI + SQLModel + Clerk + Orval",
    lifespan=lifespan,
    docs_url="/docs", # Swagger UI
    redoc_url="/redoc"
)

# --- 1. MIDDLEWARE: CORS ---
# Essential for Vibe Coding. Without this, your Next.js app (localhost:3000) 
# will be blocked from calling your FastAPI app (localhost:8000).
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allow all methods (POST, GET, PATCH, etc.)
    allow_headers=["*"], # Allow all headers (Authorization, etc.)
)

# --- 2. REGISTER ROUTERS ---
# The 'tags' argument is super important! 
# Orval uses these tags to name your React Hooks folders/files.

app.include_router(users.router, tags=["Users"])
app.include_router(leaves.router, tags=["Leaves"])
app.include_router(finance.router, tags=["Finance"])
app.include_router(audit.router, tags=["Audit"])

# --- 3. HEALTH CHECK ---
# Always have a simple root endpoint to verify the server is breathing.
@app.get("/health", tags=["System"])
def health_check():
    return {"status": "ok", "environment": "dev"}