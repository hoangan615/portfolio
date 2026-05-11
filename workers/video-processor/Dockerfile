FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    # Celery settings
    CELERY_WORKER_REDIRECT_STDOUTS_LEVEL=INFO \
    # FFmpeg work directory
    VIDEO_WORK_DIR=/tmp/video-work

WORKDIR /app

# ── System dependencies ────────────────────────────────────────────────────────
# ffmpeg     — video transcoding
# libmagic1  — MIME type detection
# curl       — healthcheck / wait scripts
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libmagic1 \
    libpq-dev \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create work directory for temporary video files
RUN mkdir -p /tmp/video-work && chmod 777 /tmp/video-work

# ── Python dependencies ────────────────────────────────────────────────────────
FROM base AS deps
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# ── Final image ────────────────────────────────────────────────────────────────
FROM deps AS final

COPY . .

# Non-root user for security
RUN addgroup --system celery && adduser --system --ingroup celery celeryuser
RUN chown -R celeryuser:celery /app /tmp/video-work
USER celeryuser

# Default command: start a Celery worker consuming the video + default queues
CMD ["celery", "-A", "worker", "worker", \
     "--loglevel=info", \
     "--concurrency=2", \
     "-Q", "video,default", \
     "--max-tasks-per-child=50"]
