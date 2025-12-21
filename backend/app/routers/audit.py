from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload

from app.core.database import get_session
from app.core.security import get_current_user
from app.models import AuditLog, User, UserRole, LeaveRequest

# --- DTOs ---
from sqlmodel import SQLModel

class AuditLogActorRead(SQLModel):
    """Minimal user info for the log view"""
    id: int
    full_name: str
    email: str
    role: UserRole

class AuditLogRead(SQLModel):
    """
    The shape of the data sent to the Frontend.
    We nest the 'actor' so the UI can display names immediately.
    """
    id: int
    leave_request_id: Optional[int]
    action: str
    field_changed: Optional[str]
    old_value: Optional[str]
    new_value: Optional[str]
    timestamp: datetime
    actor: AuditLogActorRead 

router = APIRouter()

# --- INTERNAL HELPER (The "C" in CRUD) ---
# Import and use this function in leaves.py, users.py etc.
def create_audit_log(
    session: Session,
    leave_request_id: Optional[int],
    actor_user_id: int,
    action: str,
    field_changed: Optional[str] = None,
    old_value: Optional[str] = None,
    new_value: Optional[str] = None
):
    log = AuditLog(
        leave_request_id=leave_request_id,
        actor_user_id=actor_user_id,
        action=action,
        field_changed=field_changed,
        old_value=str(old_value) if old_value is not None else None,
        new_value=str(new_value) if new_value is not None else None
    )
    session.add(log)
    # Note: We do not commit here. We let the parent transaction commit.
    # This ensures if the Leave Request update fails, the Audit Log isn't saved orphaned.

# --- API ENDPOINTS (Read Only) ---

@router.get("/", response_model=List[AuditLogRead])
async def get_all_audit_logs(
    offset: int = 0,
    limit: int = Query(default=50, le=100),
    user_id: Optional[int] = None,
    leave_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Global Audit Trail (AUDIT-004).
    Only Admins should see the full system history.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied: Auditors/Admins only")

    # Eager load the 'actor' relationship to avoid N+1 queries
    statement = select(AuditLog).options(selectinload(AuditLog.actor)).order_by(AuditLog.timestamp.desc())

    if user_id:
        statement = statement.where(AuditLog.actor_user_id == user_id)
    
    if leave_id:
        statement = statement.where(AuditLog.leave_request_id == leave_id)

    statement = statement.offset(offset).limit(limit)
    
    return session.exec(statement).all()


@router.get("/leave/{leave_request_id}", response_model=List[AuditLogRead])
async def get_leave_history(
    leave_request_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Specific history for a single Leave Request.
    Contractors can see history of THEIR own requests.
    Managers/Admins can see history of requests they have access to.
    """
    # 1. Security Check: Does the user have access to this Leave Request?
    leave = session.get(LeaveRequest, leave_request_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    is_owner = leave.user_id == current_user.id
    is_manager = current_user.role in [UserRole.MANAGER, UserRole.ADMIN]

    if not (is_owner or is_manager):
        raise HTTPException(status_code=403, detail="Not authorized to view this history")

    # 2. Fetch Logs
    statement = (
        select(AuditLog)
        .where(AuditLog.leave_request_id == leave_request_id)
        .options(selectinload(AuditLog.actor)) # Load Actor Name
        .order_by(AuditLog.timestamp.desc())
    )
    
    return session.exec(statement).all()
