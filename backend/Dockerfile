FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

ENV CLERK_JWKS_URL="https://central-snapper-39.clerk.accounts.dev/.well-known/jwks.json"

# Copy application code
COPY . .

# Make prestart script executable
RUN chmod +x prestart.sh

# Run the application
CMD ["/bin/bash", "-c", "./prestart.sh && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
