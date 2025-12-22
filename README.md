# Leavey - Leave Management System Documentation

Welcome to the documentation for Leavey, a comprehensive leave management system designed for contractors, managers, and finance officers.

## Documentation Index

- [**Architecture & Design**](docs/architecture.md): System overview and technical design.
- [**Reconciliation Logic**](docs/reconciliation.md): Deep dive into the financial engine and snapshotting.
- [**Setup & Installation**](docs/setup.md): How to get Leavey running locally and in production.
- [**User Guides**](docs/user_guides.md): Role-based manuals for all users.
- [**Test Cases**](docs/test_cases.md): Quality assurance scenarios.

## Project Overview

Leavey is built with a modern tech stack to ensure scalability and ease of use:
- **Frontend**: Next.js (TypeScript)
- **Backend**: FastAPI (Python)
- **Database**: PostgreSQL (SQLModel/Alembic)
- **Authentication**: Clerk
- **Caching**: Redis
- **Infra**: Docker Compose / GCP VM
