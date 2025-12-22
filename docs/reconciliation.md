# Deep Dive: Reconciliation Logic

The reconciliation engine is the most critical financial component of the Leavey system. It ensures that contractors are paid correctly and that the government is billed accurately for billable hours.

## Purpose

The primary goal of reconciliation is to calculate **Billable Days** for a contractor within a specific month. This data is used to generate invoices for the vendor.

## Core Formula

The system uses a "deductive" approach to calculate billable days:

$$ \text{Billable Days} = \text{Potential Working Days} - \text{Non-Chargeable Leaves} $$

### 1. Potential Working Days
This is a variable input (defaulting to 22) provided by the Finance Officer at the time of report generation. It represents the total possible working days in that month, accounting for weekends.

### 2. Chargeable Leaves
These are leaves that the government **does** pay for. Even though the contractor is away, the day is still billable to the government.
- **Example**: Annual Leave, Public Holidays.
- **Impact**: These days do **not** reduce the Billable Days total.

### 3. Non-Chargeable Leaves
These are leaves that the government **does not** pay for.
- **Example**: Unpaid Leave, Sick Leave (beyond allowance), Personal Leave.
- **Impact**: Each day of non-chargeable leave is subtracted from the Potential Working Days.

---

## Technical Mechanism: Financial Snapshotting (FIN-003)

A common problem in financial systems is "data drift"—when a setting changes but historical records should remain unchanged.

### The Problem
If a Manager changes the "Medical Leave" category from *Chargeable* to *Non-Chargeable* today, how do we ensure that last month's reconciliation reports remain accurate?

### The Solution: `cached_chargeable_status`
To solve this, Leavey implements snapshotting at the database level:
- The `LeaveCategory` table holds the **current** `is_chargeable` setting.
- The `LeaveRequest` table includes a field called `cached_chargeable_status`.
- **At the moment of submission**, the backend looks up the current category setting and "freezes" it into the request.

```python
# Conceptual logic in backend/app/routers/leaves.py
category = session.get(LeaveCategory, category_id)
new_request = LeaveRequest(
    ...,
    cached_chargeable_status=category.is_chargeable # The Snapshot
)
```

**Result**: Even if the category setting is changed later, the reconciliation engine always uses the `cached_chargeable_status` from the request, ensuring historical reports never change.

---

## Detailed Example

**Scenario**:
- **Month**: September 2025
- **Potential Working Days**: 21
- **Contractor**: John Doe
- **Leaves**:
    1.  Annual Leave (Chargeable): 2 days
    2.  Unpaid Leave (Non-Chargeable): 3 days

**Calculation**:
1.  **Start** with 21 days.
2.  **Annual Leave**: 2 days. Since it's Chargeable, we do nothing. The government pays for these.
3.  **Unpaid Leave**: 3 days. Since it's Non-Chargeable, we subtract 3.
4.  **Final Billable Days**: $21 - 3 = 18$ days.

---

## Implementation Reference

The logic is centralized in the backend to ensure consistency between the JSON API and the CSV Export:

- **File**: [finance.py](file:///Users/chaobook/leavey/my-app/backend/app/routers/finance.py)
- **Primary Function**: `generate_reconciliation_data(...)`

### Key Steps in Code:
1.  Fetch all **Active** users.
2.  Fetch all **APPROVED** leaves within the month's date range.
3.  For each user, filter their approved leaves.
4.  Sum up leaves where `cached_chargeable_status` is `False`.
5.  Subtract that sum from the `working_days` parameter.

---

## Edge Cases

| Edge Case | Handling |
| :--- | :--- |
| **Mid-Month Hires** | Currently, the system assumes the potential working days apply to all active users. (Future improvement: Pro-rate based on join date). |
| **Overlapping Months** | Leaves are currently counted based on their `start_date`. If a leave starts on the 30th and ends on the 2nd, the total duration is counted in the month of the `start_date`. |
| **Cancelled Leaves** | Only requests with the status `APPROVED` are included in the calculation. `PENDING` or `REJECTED` requests have zero impact. |
