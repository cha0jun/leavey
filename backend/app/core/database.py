# app/core/database.py
from sqlmodel import SQLModel, Session, create_engine
import os

# Use SQLite for local "vibe" development, Postgres for prod
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./local_db.sqlite")

# check_same_thread=False is needed only for SQLite
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_engine(DATABASE_URL, echo=True, connect_args=connect_args)

def get_session():
    """Dependency to provide a DB session per request"""
    with Session(engine) as session:
        yield session

def create_db_and_tables():
    """Run this on startup to create tables if they don't exist"""
    # Import models here so SQLModel knows about them
    from app import models
    SQLModel.metadata.create_all(engine)