# Setup & Installation

This guide provides instructions to get Leavey up and running.

## Prerequisites

- **Docker & Docker Compose**: Recommended for local development.
- **Node.js**: v18+ (for frontend development).
- **Python**: 3.10+ (for backend development).
- **Clerk Account**: Required for authentication.

## Local Development (Docker)

The fastest way to start the system is using Docker Compose.

1.  **Clone the repository**:
    ```bash
    git clone <repo-url>
    cd leavey/my-app
    ```

2.  **Configure Environment Variables**:
    Create a `.env` file in the root directory (refer to `.env.example`).
    ```bash
    # Clerk Config
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
    CLERK_SECRET_KEY=sk_test_...

    # Database
    DATABASE_URL=postgresql://user:password@db:5432/app_db
    ```

3.  **Start the services**:
    ```bash
    docker-compose up --build
    ```

4.  **Access the Application**:
    - Frontend: `http://localhost:3000`
    - Backend API: `http://localhost:8000`
    - API Documentation (Swagger): `http://localhost:8000/docs`

## Production/VM Setup (GCP)

For deploying to a VM (e.g., Google Cloud Platform), use the provided setup script.

1.  **Copy project files to the VM**.
2.  **Run the setup script**:
    ```bash
    chmod +x gcp_vm_setup.sh
    ./gcp_vm_setup.sh
    ```
    This script installs Docker and Docker Compose on Ubuntu.
3.  **Configure `.env`** as described above.
4.  **Launch with Docker Compose**.

## Database Migrations

Alembic is used for database migrations.

To run migrations manually:
```bash
docker-compose exec backend alembic upgrade head
```
