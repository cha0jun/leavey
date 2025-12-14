import sys
import os

# Add backend directory to sys.path
sys.path.append(os.getcwd())

from app.core.database import create_db_and_tables, engine
from sqlmodel import Session, select, SQLModel

print("Verifying Backend Setup...")

try:
    # 1. Test Database Connection
    print("1. Creating Tables...")
    create_db_and_tables()
    print("   Tables created successfully (sqlite).")

    # 2. Test Imports
    from app.routers import users, leaves, finance, audit
    print("2. Routers imported successfully.")
    
    # 3. Test Model resolution
    from app.models import User
    print(f"3. User model loaded: {User.__table__.name}")

    print("\n✅ Backend Verification Passed!")
    
except Exception as e:
    print(f"\n❌ Verification Failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
