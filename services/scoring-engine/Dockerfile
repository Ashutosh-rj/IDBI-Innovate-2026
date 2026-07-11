# syntax=docker/dockerfile:1
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies required for LightGBM OpenMP support (libgomp.so.1)
RUN apt-get update && apt-get install -y --no-install-recommends libgomp1 && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker layer caching when application code changes
COPY data-generators/sgsdg/requirements.txt /app/data-generators/sgsdg/requirements.txt
COPY services/scoring-engine/requirements.txt /app/services/scoring-engine/requirements.txt

# Install dependencies with BuildKit cache mount and resilient network timeout/retry flags
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --default-timeout=100 --retries 10 --prefer-binary \
    -r /app/data-generators/sgsdg/requirements.txt \
    -r /app/services/scoring-engine/requirements.txt

# Copy application source code after dependency installation
COPY data-generators/sgsdg /app/data-generators/sgsdg
COPY services/scoring-engine /app/services/scoring-engine

WORKDIR /app/services/scoring-engine
EXPOSE 8000
ENV PYTHONPATH=/app/data-generators/sgsdg:/app/services/scoring-engine:/app/services/scoring-engine/app
ENTRYPOINT ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
