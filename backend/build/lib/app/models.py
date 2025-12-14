from datetime import date, datetime
from typing import Optional, List
from enum import Enum
from sqlmodel import Field, SQLModel, Relationship

# Enums
class UserRole(str, Enum):
    CONTRACTOR = "Contractor"
    MANAGER = "Manager"
    FINANCE = "Finance"
    ADMIN = "Admin"

class LeaveStatus(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"

class AuditAction(str, Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    STATUS_CHANGE = "STATUS_CHANGE"

# Models

class Vendor(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    api_endpoint: Optional[str] = None
    api_key: Optional[str] = None
    
    users: List["User"] = Relationship(back_populates="vendor")

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    external_id: str = Field(index=True, unique=True, description="Stable Auth Provider Subject ID")
    email: str = Field(index=True, unique=True)
    full_name: str
    role: UserRole = Field(default=UserRole.CONTRACTOR)
    
    vendor_id: Optional[int] = Field(default=None, foreign_key="vendor.id")
    vendor: Optional[Vendor] = Relationship(back_populates="users")
    
    leave_requests: List["LeaveRequest"] = Relationship(back_populates="user")
    audit_logs: List["AuditLog"] = Relationship(back_populates="actor")

class LeaveType(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    default_chargeable: bool = Field(default=False)
    
    leave_requests: List["LeaveRequest"] = Relationship(back_populates="leave_type")

class LeaveRequest(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    leave_type_id: int = Field(foreign_key="leavetype.id")
    
    start_date: date
    end_date: date
    days_count: float
    status: LeaveStatus = Field(default=LeaveStatus.PENDING)
    approved_at: Optional[datetime] = None
    
    is_chargeable: bool = Field(description="Snapshot from LeaveType at submission")
    reason: Optional[str] = None
    attachment_url: Optional[str] = None
    
    synced_to_vendor: bool = Field(default=False)
    synced_at: Optional[datetime] = None
    
    user: User = Relationship(back_populates="leave_requests")
    leave_type: LeaveType = Relationship(back_populates="leave_requests")

class AuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    entity_id: int
    entity_type: str
    actor_id: int = Field(foreign_key="user.id")
    action: AuditAction
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    actor: User = Relationship(back_populates="audit_logs")
