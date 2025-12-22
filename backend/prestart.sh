#!/bin/bash
set -e

# Wait for database
echo "Waiting for database..."
python << END
import socket
import time
import os
from urllib.parse import urlparse

url = os.getenv("DATABASE_URL", "postgresql://user:password@db:5432/app_db")
parsed = urlparse(url)
host = parsed.hostname
port = parsed.port or 5432

while True:
    try:
        with socket.create_connection((host, port), timeout=1):
            break
    except OSError:
        time.sleep(1)
END

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

echo "Database migrations completed."
