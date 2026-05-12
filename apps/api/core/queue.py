from __future__ import annotations

from celery import Celery

from core.config import settings

celery_app = Celery(
    "community",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "modules.auth.tasks",
        "modules.videos.tasks",
        "modules.media.tasks",
        "modules.notifications.tasks",
        "modules.analytics.tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    result_expires=86400,  # 24h
    beat_schedule={
        "cleanup-expired-tokens": {
            "task": "modules.auth.tasks.cleanup_expired_tokens",
            "schedule": 3600.0,  # every hour
        },
        "aggregate-daily-analytics": {
            "task": "modules.analytics.tasks.aggregate_daily_stats",
            "schedule": 86400.0,  # every day
        },
    },
)
