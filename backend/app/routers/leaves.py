from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload

from app.core.database import get_session
from app.core.security import get_current_user
from app.models import LeaveRequest, LeaveCategory, User, UserRole, LeaveStatus, SyncStatus
from app.routers.audit import create_audit_log

# --- DTOs ---
from sqlmodel import SQLModel, Field

# 1. Shared/Nested DTOs (Must be defined first)
class DocumentRead(SQLModel):
    id: int
    filename: str
    created_at: datetime

class UserReadDTO(SQLModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    # Exclude strict relationships to avoid cycles

class LeaveCategoryReadDTO(SQLModel):
    id: int
    name: str
    is_chargeable: bool

# 2. Input DTOs
class LeaveRequestCreate(SQLModel):
    """Safe Input: No status, no flags, just request data."""
    category_id: int
    start_date: datetime
    end_date: datetime
    total_days: float
    reason: str
    attachment_url: Optional[str] = None

class LeaveRequestUpdate(SQLModel):
    """Fields a user can change while it's still PENDING."""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    total_days: Optional[float] = None
    reason: Optional[str] = None
    category_id: Optional[int] = None
    attachment_url: Optional[str] = None

# 3. Output DTO
class LeaveRequestRead(SQLModel):
    """Output: Includes nested Category and User details for the UI."""
    id: int
    user_id: int
    category_id: int
    start_date: datetime
    end_date: datetime
    total_days: float
    status: LeaveStatus
    cached_chargeable_status: bool
    reason: Optional[str] = None
    attachment_url: Optional[str] = None
    created_at: datetime
    approved_at: Optional[datetime] = None
    
    # Use explicit DTOs instead of Table Models
    category: Optional[LeaveCategoryReadDTO] = None
    user: Optional[UserReadDTO] = None
    documents: List[DocumentRead] = [] 

from app.models import Document

router = APIRouter()

# --- HELPER: Mock External Vendor API (SYNC-002) ---
def sync_to_vendor_system(leave: LeaveRequest, user: User) -> str:
    """
    Simulates sending data to the Vendor's HR API.
    In production, this would be `requests.post(VENDOR_URL, json=...)`
    """
    import uuid
    # Simulate Success
    print(f" >>> [SYNC] Pushing Leave {leave.id} for User {user.email} to Vendor API...")
    return f"VENDOR-{uuid.uuid4().hex[:8].upper()}"


# --- ENDPOINTS ---

# 1. CREATE (LEAVE-001)
@router.post("/", response_model=LeaveRequestRead)
async def create_leave_request(
    leave_data: LeaveRequestCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # A. Validate Category
    category = session.get(LeaveCategory, leave_data.category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # B. Map to DB Model
    # FIX: Use manual instantiation instead of validate to handle required fields
    db_leave = LeaveRequest(
        **leave_data.model_dump(),
        user_id=current_user.id,
        status=LeaveStatus.PENDING,
        cached_chargeable_status=category.is_chargeable,
        external_sync_status=SyncStatus.NOT_SYNCED,
        created_at=datetime.utcnow(), 
        updated_at=datetime.utcnow()
    )

    session.add(db_leave)
    
    # D. Audit Log happens *before* commit (part of same transaction)
    # We need to flush first to get an ID for the leave request
    session.flush() 
    
    create_audit_log(
        session=session,
        leave_request_id=db_leave.id,
        actor_user_id=current_user.id,
        action="CREATE",
        new_value="PENDING"
    )

    session.commit()
    session.refresh(db_leave)
    return db_leave


# 2. LIST (Dashboard)
@router.get("/", response_model=List[LeaveRequestRead])
async def list_leaves(
    offset: int = 0,
    limit: int = Query(default=50, le=100),
    status: Optional[LeaveStatus] = None,
    user_id: Optional[int] = None, # Admin filter
    mine: Optional[bool] = Query(default=None, description="Only fetch personal leaves"),
    department: Optional[str] = None, # Departmental filter
    manager_id: Optional[int] = None, # Manager-based filter
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Use selectinload to eagerly fetch relationships (Performance)
    statement = select(LeaveRequest).options(
        selectinload(LeaveRequest.category),
        selectinload(LeaveRequest.user),
        selectinload(LeaveRequest.documents)
    ).offset(offset).limit(limit).order_by(LeaveRequest.created_at.desc())

    # Role-Based Filtering
    if mine or current_user.role == UserRole.CONTRACTOR:
        # If 'mine' is requested, or user is a contractor, ONLY see their own
        statement = statement.where(LeaveRequest.user_id == current_user.id)
    else:
        # Managers/Admins can filter by specific user, department or manager
        if user_id:
            statement = statement.where(LeaveRequest.user_id == user_id)
        
        # Join User table if we need to filter by department or manager_id
        if department or manager_id:
            statement = statement.join(User)
            if department:
                statement = statement.where(User.department == department)
            if manager_id:
                statement = statement.where(User.manager_id == manager_id)
    
    if status:
        statement = statement.where(LeaveRequest.status == status)

    return session.exec(statement).all()


# 3. GET SINGLE
@router.get("/{leave_id}", response_model=LeaveRequestRead)
async def get_leave_detail(
    leave_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    leave = session.get(LeaveRequest, leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Not found")

    # Security Check
    is_owner = leave.user_id == current_user.id
    is_manager = current_user.role in [UserRole.MANAGER, UserRole.ADMIN]
    
    if not (is_owner or is_manager):
        raise HTTPException(status_code=403, detail="Not authorized")

    return leave


# 4. UPDATE (User editing their own pending request)
@router.patch("/{leave_id}", response_model=LeaveRequestRead)
async def update_leave_request(
    leave_id: int,
    update_data: LeaveRequestUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    leave = session.get(LeaveRequest, leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Not found")

    if leave.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if leave.status != LeaveStatus.PENDING:
        raise HTTPException(status_code=400, detail="Cannot edit a processed request")

    # Apply updates
    data = update_data.model_dump(exclude_unset=True)
    for key, value in data.items():
        # Audit specific field changes if needed (Optional: verbose logging)
        # For now, we just log the generic update action
        setattr(leave, key, value)

    create_audit_log(
        session=session,
        leave_request_id=leave.id,
        actor_user_id=current_user.id,
        action="UPDATE",
        field_changed="details"
    )

    session.add(leave)
    session.commit()
    session.refresh(leave)
    return leave


# 5. APPROVE / REJECT (SYNC-002)
# We use a specific endpoint for workflow actions, not a generic PATCH
@router.post("/{leave_id}/process", response_model=LeaveRequestRead)
async def process_leave_status(
    leave_id: int,
    status: LeaveStatus, # Must be APPROVED or REJECTED
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Managers use this to Approve/Reject.
    Triggers external sync if Approved.
    """
    # Security: Only Managers/Admins
    if current_user.role not in [UserRole.MANAGER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only Managers can process leaves")

    if status == LeaveStatus.PENDING:
        raise HTTPException(status_code=400, detail="Use generic update for Pending")

    leave = session.get(LeaveRequest, leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Not found")
    
    old_status = leave.status
    
    # Update Status
    leave.status = status
    leave.approved_at = datetime.now(timezone.utc) if status == LeaveStatus.APPROVED else None

    # --- SYNC-002 LOGIC ---
    if status == LeaveStatus.APPROVED:
        try:
            # Call the "External" API
            external_id = sync_to_vendor_system(leave, leave.user)
            leave.external_sync_status = SyncStatus.SYNCED
            leave.external_reference_id = external_id
        except Exception as e:
            # Fallback: Don't crash the approval, just flag it as ERROR
            print(f"Sync Failed: {e}")
            leave.external_sync_status = SyncStatus.ERROR

    # --- AUDIT LOG ---
    create_audit_log(
        session=session,
        leave_request_id=leave.id,
        actor_user_id=current_user.id,
        action="UPDATE",
        field_changed="status",
        old_value=old_status,
        new_value=status
    )

    session.add(leave)
    session.commit()
    session.refresh(leave)
    return leave


# --- 6. FILE UPLOAD ---
import os
import uuid
from fastapi import File, UploadFile, Form
from fastapi.responses import FileResponse
from app.models import Document

# Use env var for Docker, fallback to ./uploads for local dev
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/{leave_id}/upload", response_model=DocumentRead)
async def upload_document(
    leave_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Upload a file linked to a specific leave request.
    """
    leave = session.get(LeaveRequest, leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    if leave.user_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not authorized")

    ext = file.filename.split('.')[-1] if '.' in file.filename else "bin"
    safe_filename = f"{uuid.uuid4()}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    doc = Document(
        leave_request_id=leave.id,
        filename=file.filename,
        file_path=file_path
    )
    session.add(doc)
    session.commit()
    session.refresh(doc)
    
    return doc

@router.get("/documents/{document_id}/download")
async def download_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    doc = session.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    leave = session.get(LeaveRequest, doc.leave_request_id)
    if leave.user_id != current_user.id and current_user.role not in [UserRole.MANAGER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized")

    if not os.path.exists(doc.file_path):
         raise HTTPException(status_code=404, detail="File missing on disk")

    return FileResponse(doc.file_path, filename=doc.filename)