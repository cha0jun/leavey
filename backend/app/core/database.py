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
    
    # SEED DEFAULT DATA
    from sqlmodel import select
    from app.models import LeaveCategory
    
    with Session(engine) as session:
        # Check if categories exist
        statement = select(LeaveCategory)
        results = session.exec(statement).first()
        
        if not results:
            print("Running Seed: Creating Default Leave Categories...")
            defaults = [
                LeaveCategory(id=1, name="Medical", is_chargeable=True),
                LeaveCategory(id=2, name="Annual", is_chargeable=True),
                LeaveCategory(id=3, name="Unpaid", is_chargeable=False),
            ]
            for cat in defaults:
                session.add(cat)
            session.commit()
            print("Seed complete.")