# Test Cases

This document outlines core test scenarios to verify the business requirements of Leavey.

## TC-01: Leave Request Submission (Contractor)

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Log in as a Contractor. | Dashboard displays. |
| 2 | Navigate to "New Leave". | Form is visible. |
| 3 | Select "Medical" category, dates, reason, and upload a file. | Form validation passes. |
| 4 | Click "Submit". | Redirect to "My Leaves", request status is "PENDING". |
| 5 | Check Database. | `LeaveRequest` record exists with `cached_chargeable_status` correctly set based on the Medical category. |

## TC-02: Leave Approval Workflow (Manager)

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Log in as a Manager. | Navigation shows "Management" link. |
| 2 | Navigate to "Pending Requests". | Contractor's request from TC-01 is visible. |
| 3 | View request details and download attachment. | Attachment opens correctly. |
| 4 | Click "Approve". | Request status updates to "APPROVED". |
| 5 | Check Audit Log. | New `AuditLog` entry exists showing the action and the manager as the actor. |

## TC-03: Monthly Finance Reconciliation (Admin/Finance)

| Step | Action | Expected Result |
| :--- | :--- | :--- |
| 1 | Log in as an Admin. | Finance dashboard is accessible. |
| 2 | Select the month containing the approved leave from TC-02. | The Contractor's row shows in the table. |
| 3 | Enter "22" as Working Days. | Billable days are calculated: $22 - (\text{Non-Chargeable Leaves})$. |
| 4 | Click "Export CSV". | A CSV file downloads. |
| 5 | Open CSV. | Verify the data (Name, Vendor ID, Billable Days) matches the UI table. |
