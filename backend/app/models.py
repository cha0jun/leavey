from typing import Optional, List, TYPE_CHECKING
from datetime import datetime, date, timezone
from enum import Enum
from sqlmodel import SQLModel, Field, Relationship

# Prevent circular import errors during static analysis
if TYPE_CHECKING:
    from sqlmodel import Session

# --- ENUMS (These become TypeScript Enums via Orval) ---

class UserRole(str, Enum):
    CONTRACTOR = "CONTRACTOR"
    MANAGER = "MANAGER"
    ADMIN = "ADMIN"

class LeaveStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"

class SyncStatus(str, Enum):
    NOT_SYNCED = "NOT_SYNCED"
    SYNCED = "SYNCED"
    ERROR = "ERROR"

class AuditAction(str, Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    UPDATE_USER = "UPDATE_USER"

# --- MODELS ---

class User(SQLModel, table=True):
    """
    Shadow User Table. 
    'clerk_id' maps to the Authentication provider.
    'id' is used for internal database foreign keys (Performance).
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    clerk_id: str = Field(index=True, unique=True) # The specific ID from Clerk
    email: str = Field(index=True)
    full_name: str
    role: UserRole = Field(default=UserRole.CONTRACTOR)
    vendor_id: Optional[int] = Field(default=None, description="Vendor Company ID for billing grouping")
    department: Optional[str] = Field(default=None, index=True)
    manager_id: Optional[int] = Field(default=None, foreign_key="user.id")
    is_active: bool = Field(default=True)
    
    # Relationships
    leave_requests: List["LeaveRequest"] = Relationship(back_populates="user")
    audit_logs: List["AuditLog"] = Relationship(back_populates="actor")


class LeaveCategory(SQLModel, table=True):
    """
    Configuration table. Changing 'is_chargeable' here affects FUTURE requests,
    but not historical ones (due to snapshotting in LeaveRequest).
    """
    __tablename__ = "leave_category" # Explicit table name
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True) # e.g. "Medical", "Annual"
    is_chargeable: bool = Field(default=True, description="If True, Government pays Vendor for this day")

    # Relationships
    leave_requests: List["LeaveRequest"] = Relationship(back_populates="category")


class LeaveRequest(SQLModel, table=True):
    __tablename__ = "leave_request"

    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Foreign Keys
    user_id: int = Field(foreign_key="user.id")
    category_id: int = Field(foreign_key="leave_category.id")

    # Core Data
    start_date: date
    end_date: date
    total_days: float
    reason: Optional[str] = None
    attachment_url: Optional[str] = None
    
    # Workflow
    status: LeaveStatus = Field(default=LeaveStatus.PENDING, index=True)
    
    # FIN-003: Financial Snapshot
    # CRITICAL: This is set at moment of creation based on the Category at that time.
    cached_chargeable_status: bool = Field(description="Snapshot of billable status at time of submission")

    # SYNC-002: External Sync
    external_sync_status: SyncStatus = Field(default=SyncStatus.NOT_SYNCED)
    external_reference_id: Optional[str] = Field(default=None, description="ID from Vendor HR System")
    
    # Meta
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    approved_at: Optional[datetime] = None

    # Relationships
    user: User = Relationship(back_populates="leave_requests")
    category: LeaveCategory = Relationship(back_populates="leave_requests")
    audit_logs: List["AuditLog"] = Relationship(back_populates="leave_request")
    documents: List["Document"] = Relationship(back_populates="leave_request")


class AuditLog(SQLModel, table=True):
    """
    AUDIT-004: Immutable log of changes.
    """
    __tablename__ = "audit_log"

    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Foreign Keys
    leave_request_id: Optional[int] = Field(default=None, foreign_key="leave_request.id", nullable=True)
    actor_user_id: int = Field(foreign_key="user.id", description="Who made the change")

    # Change Details
    action: AuditAction
    field_changed: Optional[str] = None # e.g. "status", "category"
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationships
    leave_request: LeaveRequest = Relationship(back_populates="audit_logs")
    actor: User = Relationship(back_populates="audit_logs")


class Document(SQLModel, table=True):
    """
    Stores metadata for uploaded files linked to a leave request.
    Files are stored in the persistent volume.
    """
    __tablename__ = "document"

    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Foreign Keys
    leave_request_id: int = Field(foreign_key="leave_request.id")
    
    filename: str = Field(description="Original filename or UUID-based name")
    file_path: str = Field(description="Path on disk inside the container")
    
    # Meta
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationships
    leave_request: LeaveRequest = Relationship(back_populates="documents")
