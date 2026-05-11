"""
Celery application factory for the video-processor worker.

Queues
------
video   — all transcoding / thumbnail / preview tasks
default — catch-all for lower-priority jobs

Usage (inside Docker)
---------------------
    celery -A worker worker --loglevel=info --concurrency=2 -Q video,default

Flower (task dashboard)
-----------------------
    celery -A worker flower --port=5555
"""

from __future__ import annotations

import os
from celery import Celery
from kombu import Exchange, Queue

# ── Environment ────────────────────────────────────────────────────────────────
BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://redis:6379/1")
RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", "redis://redis:6379/2")

# ── App ────────────────────────────────────────────────────────────────────────
app = Celery(
    "video_worker",
    broker=BROKER_URL,
    backend=RESULT_BACKEND,
    include=[
        "tasks.transcode",
    ],
)

# ── Queue / exchange definitions ───────────────────────────────────────────────
default_exchange = Exchange("default", type="direct")
video_exchange = Exchange("video", type="direct")

app.conf.task_queues = (
    Queue("default", default_exchange, routing_key="default"),
    Queue("video", video_exchange, routing_key="video"),
)
app.conf.task_default_queue = "default"
app.conf.task_default_exchange = "default"
app.conf.task_default_routing_key = "default"

# Route video tasks to the dedicated queue
app.conf.task_routes = {
    "tasks.transcode.*": {"queue": "video", "routing_key": "video"},
}

# ── Serialisation ──────────────────────────────────────────────────────────────
app.conf.task_serializer = "json"
app.conf.result_serializer = "json"
app.conf.accept_content = ["json"]
app.conf.result_expires = 60 * 60 * 24  # 24 hours

# ── Worker behaviour ───────────────────────────────────────────────────────────
app.conf.worker_prefetch_multiplier = 1   # one task at a time per slot (video is heavy)
app.conf.task_acks_late = True            # ack only after the task completes
app.conf.worker_max_tasks_per_child = 50  # recycle worker after 50 tasks (memory safety)

# ── Retry defaults ─────────────────────────────────────────────────────────────
app.conf.task_annotations = {
    "*": {
        "max_retries": 3,
        "default_retry_delay": 30,
    }
}

# ── Beat schedule (optional periodic tasks) ────────────────────────────────────
app.conf.beat_schedule = {
    # Clean up stale tmp files older than 24 h once a day at 03:00 UTC
    # Uncomment and add the task when you implement cleanup:
    # "cleanup-tmp-daily": {
    #     "task": "tasks.transcode.cleanup_stale_tmp",
    #     "schedule": crontab(hour=3, minute=0),
    # },
}

if __name__ == "__main__":
    app.start()
