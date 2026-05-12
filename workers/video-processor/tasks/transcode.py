"""
tasks/transcode.py — Video transcoding pipeline

Pipeline (per video upload)
───────────────────────────
1. Download raw file from S3/MinIO into a local temp directory.
2. Probe the source with FFprobe to gather metadata.
3. Transcode to HLS adaptive bitrate streams: 1080p, 720p, 480p.
4. Generate a poster thumbnail (JPEG) at t=3 s.
5. Generate a short animated preview GIF (t=3-8 s, 320px wide).
6. Upload all outputs back to S3 under a structured key prefix.
7. Update the VideoJob row in PostgreSQL (status, durations, URLs).
8. Delete the original raw file from S3.

Error handling
──────────────
All exceptions are caught, the job is marked FAILED in the DB, and
the task is retried up to 3 times with exponential back-off before
giving up permanently.
"""

from __future__ import annotations

import logging
import os
import shutil
import subprocess
import tempfile
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import boto3
import ffmpeg
import psycopg2
from botocore.client import Config
from celery import shared_task
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)

# ── Constants ──────────────────────────────────────────────────────────────────
VIDEO_WORK_DIR = os.environ.get("VIDEO_WORK_DIR", "/tmp/video-work")

# HLS renditions: (label, height, video_bitrate_k, audio_bitrate_k)
HLS_RENDITIONS: list[tuple[str, int, int, int]] = [
    ("1080p", 1080, 5000, 192),
    ("720p", 720, 2800, 128),
    ("480p", 480, 1400, 96),
]

HLS_SEGMENT_DURATION = 6  # seconds per .ts segment
THUMBNAIL_TIME = 3        # seconds into the video for the poster frame
GIF_START = 3             # start time for the preview GIF
GIF_DURATION = 5          # duration of the preview GIF in seconds
GIF_WIDTH = 320           # pixel width of the preview GIF


# ── S3 client factory ──────────────────────────────────────────────────────────
def _s3_client() -> Any:
    """Return a boto3 S3 client configured for MinIO / S3."""
    return boto3.client(
        "s3",
        endpoint_url=os.environ.get("S3_ENDPOINT_URL"),
        aws_access_key_id=os.environ.get("S3_ACCESS_KEY_ID", "minioadmin"),
        aws_secret_access_key=os.environ.get("S3_SECRET_ACCESS_KEY", "minioadmin"),
        region_name=os.environ.get("S3_REGION", "us-east-1"),
        config=Config(signature_version="s3v4"),
    )


def _bucket() -> str:
    return os.environ.get("S3_BUCKET_NAME", "portfolio-media")


# ── Database helpers ───────────────────────────────────────────────────────────
def _db_conn():
    """
    Open a synchronous psycopg2 connection.

    The worker uses the sync driver because Celery tasks run in a
    regular (non-async) Python thread.
    """
    db_url = os.environ.get(
        "DATABASE_URL",
        "postgresql://postgres:password@postgres:5432/portfolio_db",
    )
    # Strip asyncpg prefix if present
    db_url = db_url.replace("postgresql+asyncpg://", "postgresql://")
    return psycopg2.connect(db_url)


def _update_job(
    job_id: str,
    status: str,
    *,
    outputs: dict | None = None,
    duration_seconds: float | None = None,
    error_message: str | None = None,
) -> None:
    """Upsert video_jobs.status and optional output metadata."""
    try:
        conn = _db_conn()
        with conn, conn.cursor() as cur:
            cur.execute(
                """
                UPDATE video_jobs
                   SET status           = %s,
                       outputs          = COALESCE(%s::jsonb, outputs),
                       duration_seconds = COALESCE(%s, duration_seconds),
                       error_message    = COALESCE(%s, error_message),
                       updated_at       = NOW()
                 WHERE id = %s
                """,
                (
                    status,
                    psycopg2.extras.Json(outputs) if outputs else None,
                    duration_seconds,
                    error_message,
                    job_id,
                ),
            )
        conn.close()
    except Exception as exc:  # never crash the task over a DB update
        logger.error("DB update failed for job %s: %s", job_id, exc)


# ── Data classes ───────────────────────────────────────────────────────────────
@dataclass
class TranscodeResult:
    job_id: str
    hls_master_url: str
    thumbnail_url: str
    preview_gif_url: str
    renditions: list[dict] = field(default_factory=list)
    duration_seconds: float = 0.0


# ── Helpers ────────────────────────────────────────────────────────────────────
def _probe(src: Path) -> dict:
    """Run ffprobe and return the parsed JSON."""
    try:
        return ffmpeg.probe(str(src))
    except ffmpeg.Error as exc:
        raise RuntimeError(f"ffprobe failed: {exc.stderr.decode()}") from exc


def _s3_key_prefix(job_id: str) -> str:
    return f"videos/{job_id}"


def _upload_file(s3, local_path: Path, s3_key: str) -> str:
    """Upload a local file to S3 and return the public URL."""
    bucket = _bucket()
    content_type = _guess_content_type(local_path.suffix)
    s3.upload_file(
        str(local_path),
        bucket,
        s3_key,
        ExtraArgs={"ContentType": content_type},
    )
    endpoint = os.environ.get("S3_ENDPOINT_URL", "")
    public_base = os.environ.get("S3_PUBLIC_URL", f"{endpoint}/{bucket}")
    return f"{public_base}/{s3_key}"


def _upload_directory(s3, local_dir: Path, s3_prefix: str) -> list[str]:
    """Recursively upload every file in local_dir to S3."""
    urls = []
    for file in sorted(local_dir.rglob("*")):
        if file.is_file():
            rel = file.relative_to(local_dir)
            key = f"{s3_prefix}/{rel}"
            urls.append(_upload_file(s3, file, key))
    return urls


def _guess_content_type(suffix: str) -> str:
    mapping = {
        ".m3u8": "application/x-mpegURL",
        ".ts": "video/MP2T",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".mp4": "video/mp4",
    }
    return mapping.get(suffix.lower(), "application/octet-stream")


# ── FFmpeg pipeline ────────────────────────────────────────────────────────────
def _transcode_hls(src: Path, out_dir: Path) -> list[dict]:
    """
    Produce HLS adaptive bitrate streams for each rendition.

    Output layout
    -------------
    out_dir/
      master.m3u8
      1080p/
        playlist.m3u8
        seg000.ts  …
      720p/  …
      480p/  …
    """
    rendition_meta = []

    # Build FFmpeg inputs / outputs
    stream = ffmpeg.input(str(src))

    # We use subprocess + FFmpeg CLI for HLS because the ffmpeg-python
    # HLS wrapper has limited multi-rendition support.
    for label, height, vbr, abr in HLS_RENDITIONS:
        rend_dir = out_dir / label
        rend_dir.mkdir(parents=True, exist_ok=True)
        playlist = rend_dir / "playlist.m3u8"
        segment_pattern = str(rend_dir / "seg%03d.ts")

        cmd = [
            "ffmpeg", "-y",
            "-i", str(src),
            # Video
            "-vf", f"scale=-2:{height}",
            "-c:v", "libx264",
            "-profile:v", "high",
            "-level", "4.1",
            "-preset", "veryfast",
            "-crf", "23",
            "-maxrate", f"{vbr}k",
            "-bufsize", f"{vbr * 2}k",
            "-g", str(HLS_SEGMENT_DURATION * 30),   # keyframe every segment
            "-sc_threshold", "0",
            # Audio
            "-c:a", "aac",
            "-b:a", f"{abr}k",
            "-ac", "2",
            "-ar", "44100",
            # HLS muxer
            "-f", "hls",
            "-hls_time", str(HLS_SEGMENT_DURATION),
            "-hls_playlist_type", "vod",
            "-hls_segment_filename", segment_pattern,
            str(playlist),
        ]

        logger.info("Transcoding %s …", label)
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(
                f"FFmpeg failed for {label}:\n{result.stderr}"
            )

        rendition_meta.append(
            {
                "label": label,
                "height": height,
                "video_bitrate_kbps": vbr,
                "audio_bitrate_kbps": abr,
                "playlist": str(playlist),
            }
        )

    # Write a master playlist that references all renditions
    master_lines = ["#EXTM3U", "#EXT-X-VERSION:3", ""]
    for meta in rendition_meta:
        bw = meta["video_bitrate_kbps"] * 1000
        res_map = {1080: "1920x1080", 720: "1280x720", 480: "854x480"}
        res = res_map.get(meta["height"], "")
        master_lines.append(
            f'#EXT-X-STREAM-INF:BANDWIDTH={bw},RESOLUTION={res},'
            f'CODECS="avc1.640028,mp4a.40.2"'
        )
        master_lines.append(f"{meta['label']}/playlist.m3u8")
        master_lines.append("")

    master_path = out_dir / "master.m3u8"
    master_path.write_text("\n".join(master_lines))
    logger.info("Master playlist written to %s", master_path)

    return rendition_meta


def _generate_thumbnail(src: Path, out_path: Path) -> None:
    """Extract a single JPEG frame at THUMBNAIL_TIME seconds."""
    cmd = [
        "ffmpeg", "-y",
        "-ss", str(THUMBNAIL_TIME),
        "-i", str(src),
        "-vframes", "1",
        "-q:v", "2",
        "-vf", "scale=-2:720",
        str(out_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"Thumbnail generation failed:\n{result.stderr}")
    logger.info("Thumbnail saved to %s", out_path)


def _generate_preview_gif(src: Path, out_path: Path) -> None:
    """
    Create a looping preview GIF using a two-pass palette approach
    (gives much better quality than a naive single-pass conversion).
    """
    palette_path = out_path.with_suffix(".palette.png")
    try:
        # Pass 1: generate palette
        cmd_palette = [
            "ffmpeg", "-y",
            "-ss", str(GIF_START),
            "-t", str(GIF_DURATION),
            "-i", str(src),
            "-vf", f"fps=10,scale={GIF_WIDTH}:-1:flags=lanczos,palettegen=stats_mode=diff",
            str(palette_path),
        ]
        r1 = subprocess.run(cmd_palette, capture_output=True, text=True)
        if r1.returncode != 0:
            raise RuntimeError(f"GIF palette generation failed:\n{r1.stderr}")

        # Pass 2: render GIF
        cmd_gif = [
            "ffmpeg", "-y",
            "-ss", str(GIF_START),
            "-t", str(GIF_DURATION),
            "-i", str(src),
            "-i", str(palette_path),
            "-lavfi",
            f"fps=10,scale={GIF_WIDTH}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer",
            str(out_path),
        ]
        r2 = subprocess.run(cmd_gif, capture_output=True, text=True)
        if r2.returncode != 0:
            raise RuntimeError(f"GIF render failed:\n{r2.stderr}")

        logger.info("Preview GIF saved to %s", out_path)
    finally:
        if palette_path.exists():
            palette_path.unlink()


# ── Main Celery task ───────────────────────────────────────────────────────────
@shared_task(
    bind=True,
    name="tasks.transcode.transcode_video",
    max_retries=3,
    default_retry_delay=60,
    acks_late=True,
    track_started=True,
    queue="video",
)
def transcode_video(
    self,
    job_id: str,
    s3_raw_key: str,
    *,
    owner_id: str | None = None,
) -> dict:
    """
    Full video processing pipeline.

    Parameters
    ----------
    job_id     : UUID of the VideoJob row in the database.
    s3_raw_key : S3 object key of the original uploaded file.
    owner_id   : Optional UUID of the uploading user (for logging).

    Returns
    -------
    dict with keys: hls_master_url, thumbnail_url, preview_gif_url, renditions
    """
    task_start = time.monotonic()
    logger.info(
        "Starting transcode job_id=%s raw_key=%s owner=%s",
        job_id, s3_raw_key, owner_id,
    )

    # Mark job as processing
    _update_job(job_id, "processing")

    # Create a per-job temp directory so parallel tasks don't collide
    work_dir = Path(VIDEO_WORK_DIR) / job_id
    work_dir.mkdir(parents=True, exist_ok=True)

    try:
        s3 = _s3_client()
        bucket = _bucket()
        prefix = _s3_key_prefix(job_id)

        # ── 1. Download raw file ───────────────────────────────────────────────
        raw_suffix = Path(s3_raw_key).suffix or ".mp4"
        raw_path = work_dir / f"raw{raw_suffix}"
        logger.info("Downloading s3://%s/%s …", bucket, s3_raw_key)
        s3.download_file(bucket, s3_raw_key, str(raw_path))
        logger.info("Downloaded %.1f MB", raw_path.stat().st_size / 1_048_576)

        # ── 2. Probe source ────────────────────────────────────────────────────
        probe_data = _probe(raw_path)
        video_streams = [
            s for s in probe_data.get("streams", [])
            if s.get("codec_type") == "video"
        ]
        duration_seconds = float(
            probe_data.get("format", {}).get("duration", 0)
        )
        logger.info(
            "Source: duration=%.1fs streams=%d",
            duration_seconds, len(video_streams),
        )

        # ── 3. Transcode to HLS ────────────────────────────────────────────────
        hls_dir = work_dir / "hls"
        hls_dir.mkdir(parents=True, exist_ok=True)
        rendition_meta = _transcode_hls(raw_path, hls_dir)

        # ── 4. Thumbnail ───────────────────────────────────────────────────────
        # Clamp thumbnail time so it doesn't exceed video duration
        thumb_time = min(THUMBNAIL_TIME, max(0, duration_seconds - 1))
        thumbnail_path = work_dir / "thumbnail.jpg"
        _generate_thumbnail(raw_path, thumbnail_path)

        # ── 5. Preview GIF ─────────────────────────────────────────────────────
        gif_path = work_dir / "preview.gif"
        _generate_preview_gif(raw_path, gif_path)

        # ── 6. Upload all outputs to S3 ────────────────────────────────────────
        logger.info("Uploading HLS tree …")
        _upload_directory(s3, hls_dir, f"{prefix}/hls")

        hls_master_url = _upload_file(
            s3, hls_dir / "master.m3u8", f"{prefix}/hls/master.m3u8"
        )
        thumbnail_url = _upload_file(s3, thumbnail_path, f"{prefix}/thumbnail.jpg")
        preview_gif_url = _upload_file(s3, gif_path, f"{prefix}/preview.gif")

        # ── 7. Update DB ───────────────────────────────────────────────────────
        outputs = {
            "hls_master_url": hls_master_url,
            "thumbnail_url": thumbnail_url,
            "preview_gif_url": preview_gif_url,
            "renditions": rendition_meta,
        }
        _update_job(
            job_id,
            "completed",
            outputs=outputs,
            duration_seconds=duration_seconds,
        )

        elapsed = time.monotonic() - task_start
        logger.info(
            "Transcode complete job_id=%s in %.1fs", job_id, elapsed
        )

        # ── 8. Delete raw file ─────────────────────────────────────────────────
        try:
            s3.delete_object(Bucket=bucket, Key=s3_raw_key)
            logger.info("Deleted raw file s3://%s/%s", bucket, s3_raw_key)
        except Exception as exc:
            logger.warning("Could not delete raw file: %s", exc)

        return outputs

    except Exception as exc:
        logger.exception("Transcode failed for job_id=%s: %s", job_id, exc)
        _update_job(job_id, "failed", error_message=str(exc))

        # Retry with exponential back-off
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))

    finally:
        # Always clean up the temp directory to reclaim disk space
        if work_dir.exists():
            shutil.rmtree(work_dir, ignore_errors=True)
            logger.debug("Cleaned up work dir %s", work_dir)


# ── Utility task ──────────────────────────────────────────────────────────────
@shared_task(
    name="tasks.transcode.cleanup_stale_tmp",
    queue="default",
)
def cleanup_stale_tmp(max_age_hours: int = 24) -> dict:
    """
    Remove temp directories that were not cleaned up (e.g. after a crash).
    Intended to be called by Celery Beat on a daily schedule.
    """
    import time as _time

    work_root = Path(VIDEO_WORK_DIR)
    if not work_root.exists():
        return {"removed": 0}

    cutoff = _time.time() - (max_age_hours * 3600)
    removed = 0
    for entry in work_root.iterdir():
        if entry.is_dir() and entry.stat().st_mtime < cutoff:
            shutil.rmtree(entry, ignore_errors=True)
            removed += 1
            logger.info("Removed stale work dir %s", entry)

    logger.info("cleanup_stale_tmp: removed %d directories", removed)
    return {"removed": removed}
