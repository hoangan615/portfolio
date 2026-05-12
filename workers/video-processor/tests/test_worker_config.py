"""
Unit tests for the video-processor Celery worker configuration.
These tests do not require a live Redis or FFmpeg installation.
"""
from __future__ import annotations

import os
import sys
from unittest.mock import MagicMock, patch

import pytest

# Stub heavy dependencies so tests run without them installed
for _mod in ("ffmpeg", "psycopg2", "boto3", "botocore"):
    if _mod not in sys.modules:
        sys.modules[_mod] = MagicMock()

# Provide required env vars before worker is imported
os.environ.setdefault("CELERY_BROKER_URL", "memory://")
os.environ.setdefault("CELERY_RESULT_BACKEND", "cache+memory://")


# ── Worker app config ─────────────────────────────────────────────────────────


def test_worker_app_name():
    from worker import app

    assert app.main == "video_worker"


def test_worker_queues_defined():
    from worker import app

    queue_names = {q.name for q in app.conf.task_queues}
    assert "video" in queue_names
    assert "default" in queue_names


def test_video_tasks_routed_to_video_queue():
    from worker import app

    routes = app.conf.task_routes
    pattern_key = next(iter(routes))
    assert "transcode" in pattern_key
    assert routes[pattern_key]["queue"] == "video"


def test_serializers_are_json():
    from worker import app

    assert app.conf.task_serializer == "json"
    assert app.conf.result_serializer == "json"
    assert "json" in app.conf.accept_content


def test_late_ack_enabled():
    from worker import app

    assert app.conf.task_acks_late is True


def test_max_tasks_per_child():
    from worker import app

    assert app.conf.worker_max_tasks_per_child == 50


# ── Transcode constants ───────────────────────────────────────────────────────


def test_hls_renditions_defined():
    from tasks.transcode import HLS_RENDITIONS

    assert len(HLS_RENDITIONS) >= 2
    labels = [r[0] for r in HLS_RENDITIONS]
    assert "720p" in labels


def test_hls_renditions_heights_descending():
    from tasks.transcode import HLS_RENDITIONS

    heights = [r[1] for r in HLS_RENDITIONS]
    assert heights == sorted(heights, reverse=True), "Renditions should go highest → lowest"


def test_thumbnail_time_positive():
    from tasks.transcode import THUMBNAIL_TIME

    assert THUMBNAIL_TIME > 0


def test_gif_duration_positive():
    from tasks.transcode import GIF_DURATION

    assert GIF_DURATION > 0


def test_hls_segment_duration_sensible():
    from tasks.transcode import HLS_SEGMENT_DURATION

    assert 2 <= HLS_SEGMENT_DURATION <= 10
