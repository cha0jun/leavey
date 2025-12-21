from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select
from app.core.database import get_session
from app.core.security import get_current_user
from app.models import User, UserRole, AuditAction
from app.routers.audit import create_audit_log

router = APIRouter()

# --- DTOs (Data Transfer Objects) ---
# We define these here to prevent users from injecting fields they shouldn't change
# (e.g., A contractor shouldn't be able to change their own role to ADMIN).

from sqlmodel import SQLModel

class UserRead(SQLModel):
    """Public User profile"""
    id: int
    clerk_id: str
    email: str
    full_name: str
    role: UserRole
    vendor_id: Optional[int] = None
    department: Optional[str] = None
    manager_id: Optional[int] = None
    is_active: bool

class UserUpdateSelf(SQLModel):
    """Fields a user can update about themselves"""
    full_name: Optional[str] = None
    # Note: We don't allow email update here because Clerk owns that identity.

class UserUpdateAdmin(SQLModel):
    """Fields an Admin can update on other users"""
    role: Optional[UserRole] = None
    vendor_id: Optional[int] = None
    full_name: Optional[str] = None
    department: Optional[str] = None
    manager_id: Optional[int] = None
    is_active: Optional[bool] = None

# --- ENDPOINTS ---

# 1. GET /me - The most frequently called endpoint
# Used by the Frontend to load the current user's profile and permissions
@router.get("/me", response_model=UserRead)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user

# 2. PATCH /me - User updates their own profile
@router.patch("/me", response_model=UserRead)
async def update_current_user_profile(
    user_update: UserUpdateSelf,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Only update fields that were actually sent
    user_data = user_update.model_dump(exclude_unset=True)
    
    for key, value in user_data.items():
        setattr(current_user, key, value)

    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user

# --- ADMIN ENDPOINTS ---

# 3. GET / - List all users (Admin Only)
@router.get("/", response_model=List[UserRead])
async def list_users(
    offset: int = 0,
    limit: int = Query(default=100, le=100),
    role: Optional[UserRole] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    statement = select(User).offset(offset).limit(limit)
    
    if role:
        statement = statement.where(User.role == role)
        
    users = session.exec(statement).all()
    return users

# 4. GET /{user_id} - Get specific user details
@router.get("/{user_id}", response_model=UserRead)
async def get_user_by_id(
    user_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Allow if Admin OR if looking up self
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# 5. PATCH /{user_id} - Admin updates a user (e.g. promoting to Manager)
@router.patch("/{user_id}", response_model=UserRead)
async def update_user_details(
    user_id: int,
    user_update: UserUpdateAdmin,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    user_db = session.get(User, user_id)
    if not user_db:
        raise HTTPException(status_code=404, detail="User not found")

    user_data = user_update.model_dump(exclude_unset=True)
    
    for key, value in user_data.items():
        old_val = getattr(user_db, key)
        if old_val != value:
            create_audit_log(
                session=session,
                leave_request_id=None,
                actor_user_id=current_user.id,
                action=AuditAction.UPDATE_USER,
                field_changed=key,
                old_value=old_val,
                new_value=value
            )
            setattr(user_db, key, value)

    session.add(user_db)
    session.commit()
    session.refresh(user_db)
    return user_db

# Note: We do NOT have a POST /users (Create) here.
# Why? Because creation is handled by the Clerk Webhook (app/api/v1/webhooks.py).
# If you add a manual create here, you risk creating a user that doesn't exist 
# in the auth provider, leading to login errors.