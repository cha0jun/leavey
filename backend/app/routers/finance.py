import csv
import io
from typing import List, Optional
from datetime import date, datetime
import calendar
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select, col

from app.core.database import get_session
from app.core.security import get_current_user
from app.models import User, LeaveRequest, LeaveStatus, UserRole, LeaveCategory

# --- DTOs ---
from sqlmodel import SQLModel

class FinanceReportRow(SQLModel):
    """
    The Data shape for the UI Table (React/TanStack Table).
    """
    user_id: int
    full_name: str
    vendor_id: Optional[int]
    total_working_days: int
    days_worked: float        # Days actually present
    chargeable_leave: float   # e.g. Annual Leave (Gov pays)
    non_chargeable_leave: float # e.g. Unpaid/Medical (Gov doesn't pay)
    total_billable_days: float # The final number for the invoice

class FinanceSummary(SQLModel):
    report_month: str
    total_invoice_amount: float # Placeholder if we had rates
    rows: List[FinanceReportRow]

router = APIRouter()

# --- HELPER: Date Range Calculator ---
def get_month_date_range(year: int, month: int):
    """Returns the first and last date of a given month."""
    _, last_day = calendar.monthrange(year, month)
    start_date = date(year, month, 1)
    end_date = date(year, month, last_day)
    return start_date, end_date

# --- HELPER: The Core Calculation Logic ---
def generate_reconciliation_data(
    session: Session, 
    year: int, 
    month: int, 
    working_days: int
) -> List[FinanceReportRow]:
    """
    Central logic for both JSON response and CSV export.
    Keeps business logic in one place (DRY).
    """
    start_date, end_date = get_month_date_range(year, month)

    # 1. Fetch All Contractors (Active)
    # In a real app, you'd filter by is_active=True
    users = session.exec(select(User).where(User.role == UserRole.CONTRACTOR)).all()

    # 2. Fetch All APPROVED Leaves for this period
    # Note: We filter by Approved status to ensure financial accuracy
    statement = (
        select(LeaveRequest)
        .where(LeaveRequest.start_date >= start_date)
        .where(LeaveRequest.start_date <= end_date) # Simplified: logic usually requires overlapping checks
        .where(LeaveRequest.status == LeaveStatus.APPROVED)
    )
    leaves = session.exec(statement).all()

    # 3. Aggregate Data in Python (Easier to read/debug than complex SQL grouping)
    report_rows = []

    for user in users:
        user_leaves = [l for l in leaves if l.user_id == user.id]
        
        # Logic from Story FIN-003:
        # Use 'cached_chargeable_status' (The Snapshot) not the current Category setting
        chargeable_sum = sum(l.total_days for l in user_leaves if l.cached_chargeable_status)
        non_chargeable_sum = sum(l.total_days for l in user_leaves if not l.cached_chargeable_status)
        
        # Calculation:
        # Billable Days = Potential Working Days - Non-Chargeable Leaves
        # (Chargeable leaves like Annual Leave are considered "Paid", so they don't reduce the bill)
        total_billable = working_days - non_chargeable_sum

        row = FinanceReportRow(
            user_id=user.id,
            full_name=user.full_name,
            vendor_id=user.vendor_id,
            total_working_days=working_days,
            days_worked=working_days - (chargeable_sum + non_chargeable_sum),
            chargeable_leave=chargeable_sum,
            non_chargeable_leave=non_chargeable_sum,
            total_billable_days=total_billable
        )
        report_rows.append(row)

    return report_rows


# --- ENDPOINTS ---

@router.get("/reconciliation", response_model=FinanceSummary)
async def get_monthly_reconciliation(
    year: int,
    month: int,
    working_days: int = Query(default=22, description="Potential working days in this month"),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Dashboard View: Returns JSON data for the frontend table.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Access denied")

    data = generate_reconciliation_data(session, year, month, working_days)
    
    return FinanceSummary(
        report_month=f"{year}-{month:02d}",
        total_invoice_amount=0.0, # Placeholder
        rows=data
    )


@router.get("/export")
async def export_reconciliation_csv(
    year: int,
    month: int,
    working_days: int = Query(default=22),
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Download Action: Streams a CSV file directly to the browser.
    Essential for Finance Officers who love Excel.
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER]:
        raise HTTPException(status_code=403, detail="Access denied")

    data = generate_reconciliation_data(session, year, month, working_days)

    # Create a generator for StreamingResponse
    def iter_csv():
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            "Contractor Name", 
            "Vendor ID", 
            "Potential Working Days", 
            "Chargeable Leave (Days)", 
            "Non-Chargeable Leave (Days)", 
            "TOTAL BILLABLE DAYS"
        ])
        output.seek(0)
        yield output.read()
        output.truncate(0)
        output.seek(0)

        # Rows
        for row in data:
            writer.writerow([
                row.full_name,
                row.vendor_id or "N/A",
                row.total_working_days,
                row.chargeable_leave,
                row.non_chargeable_leave,
                row.total_billable_days
            ])
            output.seek(0)
            yield output.read()
            output.truncate(0)
            output.seek(0)

    filename = f"billing_recon_{year}_{month:02d}.csv"
    
    return StreamingResponse(
        iter_csv(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )