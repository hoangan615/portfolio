"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-05-11 00:00:00.000000

"""
from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ENUM as PGENUM
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    # ── Extensions ────────────────────────────────────────────────────────────
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")

    # ── Enums ─────────────────────────────────────────────────────────────────
    PGENUM("owner", "admin", "moderator", "member", "restricted", "banned", "guest", name="user_role").create(bind, checkfirst=True)
    PGENUM("active", "pending", "suspended", "deleted", name="user_status").create(bind, checkfirst=True)
    PGENUM("article", "short", "gallery", "til", name="post_type").create(bind, checkfirst=True)
    PGENUM("draft", "pending_review", "published", "rejected", "archived", name="post_status").create(bind, checkfirst=True)
    PGENUM("uploading", "processing", "ready", "failed", name="video_status").create(bind, checkfirst=True)
    PGENUM("public", "unlisted", "private", name="video_visibility").create(bind, checkfirst=True)
    PGENUM("pending", "running", "completed", "failed", name="video_job_status").create(bind, checkfirst=True)
    PGENUM("post", "video", name="comment_content_type").create(bind, checkfirst=True)
    PGENUM("post", "video", "comment", name="reaction_content_type").create(bind, checkfirst=True)
    PGENUM("post", "video", name="bookmark_content_type").create(bind, checkfirst=True)
    PGENUM("pending", "reviewed", "dismissed", "actioned", name="report_status").create(bind, checkfirst=True)
    PGENUM("warn", "mute", "restrict", "suspend", "ban", "delete_content", "restore_content", name="moderation_action_type").create(bind, checkfirst=True)

    # ── users ─────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("username", sa.String(50), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=True),
        sa.Column("display_name", sa.String(100), nullable=True),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("cover_url", sa.String(500), nullable=True),
        sa.Column("bio", sa.Text, nullable=True),
        sa.Column("website_url", sa.String(500), nullable=True),
        sa.Column("location", sa.String(100), nullable=True),
        sa.Column("role", PGENUM("owner", "admin", "moderator", "member", "restricted", "banned", "guest", name="user_role", create_type=False), nullable=False, server_default="member"),
        sa.Column("status", PGENUM("active", "pending", "suspended", "deleted", name="user_status", create_type=False), nullable=False, server_default="pending"),
        sa.Column("email_verified", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("follower_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("following_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("post_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ── oauth_accounts ────────────────────────────────────────────────────────
    op.create_table(
        "oauth_accounts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("provider", sa.String(50), nullable=False),
        sa.Column("provider_user_id", sa.String(255), nullable=False),
        sa.Column("access_token", sa.Text, nullable=True),
        sa.Column("refresh_token", sa.Text, nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("provider", "provider_user_id", name="uq_oauth_provider_user"),
    )
    op.create_index("ix_oauth_accounts_user_id", "oauth_accounts", ["user_id"])

    # ── refresh_tokens ────────────────────────────────────────────────────────
    op.create_table(
        "refresh_tokens",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("token_hash", sa.String(255), nullable=False, unique=True),
        sa.Column("device_info", sa.String(255), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])

    # ── user_settings ─────────────────────────────────────────────────────────
    op.create_table(
        "user_settings",
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("email_on_follow", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("email_on_comment", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("email_on_reaction", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("email_newsletter", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("profile_public", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("show_email", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("theme", sa.String(20), nullable=False, server_default="system"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # ── user_storage_usage ────────────────────────────────────────────────────
    op.create_table(
        "user_storage_usage",
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("images_bytes", sa.Integer, nullable=False, server_default="0"),
        sa.Column("videos_bytes", sa.Integer, nullable=False, server_default="0"),
        sa.Column("other_bytes", sa.Integer, nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # ── follows ───────────────────────────────────────────────────────────────
    op.create_table(
        "follows",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("follower_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("following_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("follower_id", "following_id"),
    )
    op.create_index("ix_follows_follower_id", "follows", ["follower_id"])
    op.create_index("ix_follows_following_id", "follows", ["following_id"])

    # ── categories ───────────────────────────────────────────────────────────
    op.create_table(
        "categories",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_categories_slug", "categories", ["slug"], unique=True)

    # ── tags ──────────────────────────────────────────────────────────────────
    op.create_table(
        "tags",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_tags_slug", "tags", ["slug"], unique=True)

    # ── tag_follows ───────────────────────────────────────────────────────────
    op.create_table(
        "tag_follows",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tag_id", UUID(as_uuid=True), sa.ForeignKey("tags.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "tag_id"),
    )
    op.create_index("ix_tag_follows_user_id", "tag_follows", ["user_id"])
    op.create_index("ix_tag_follows_tag_id", "tag_follows", ["tag_id"])

    # ── portfolio_profiles ────────────────────────────────────────────────────
    op.create_table(
        "portfolio_profiles",
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("headline", sa.String(200), nullable=True),
        sa.Column("tagline", sa.String(300), nullable=True),
        sa.Column("about", sa.Text, nullable=True),
        sa.Column("resume_url", sa.String(500), nullable=True),
        sa.Column("github_url", sa.String(500), nullable=True),
        sa.Column("linkedin_url", sa.String(500), nullable=True),
        sa.Column("twitter_url", sa.String(500), nullable=True),
        sa.Column("open_to_work", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # ── skills ────────────────────────────────────────────────────────────────
    op.create_table(
        "skills",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("portfolio_profiles.user_id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column("proficiency", sa.Integer, nullable=True),
        sa.Column("icon_url", sa.String(500), nullable=True),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_skills_user_id", "skills", ["user_id"])

    # ── experiences ───────────────────────────────────────────────────────────
    op.create_table(
        "experiences",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("portfolio_profiles.user_id", ondelete="CASCADE"), nullable=False),
        sa.Column("company", sa.String(200), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("location", sa.String(200), nullable=True),
        sa.Column("start_date", sa.String(20), nullable=False),
        sa.Column("end_date", sa.String(20), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("technologies", sa.Text, nullable=True),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_experiences_user_id", "experiences", ["user_id"])

    # ── projects ──────────────────────────────────────────────────────────────
    op.create_table(
        "projects",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("portfolio_profiles.user_id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("tech_stack", sa.Text, nullable=True),
        sa.Column("cover_image_url", sa.String(500), nullable=True),
        sa.Column("demo_url", sa.String(500), nullable=True),
        sa.Column("repo_url", sa.String(500), nullable=True),
        sa.Column("featured", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_projects_user_id", "projects", ["user_id"])

    # ── posts ─────────────────────────────────────────────────────────────────
    op.create_table(
        "posts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", PGENUM("article", "short", "gallery", "til", name="post_type", create_type=False), nullable=False, server_default="article"),
        sa.Column("title", sa.String(300), nullable=True),
        sa.Column("slug", sa.String(350), nullable=False),
        sa.Column("content", sa.Text, nullable=True),
        sa.Column("excerpt", sa.String(500), nullable=True),
        sa.Column("cover_image_url", sa.String(500), nullable=True),
        sa.Column("status", PGENUM("draft", "pending_review", "published", "rejected", "archived", name="post_status", create_type=False), nullable=False, server_default="draft"),
        sa.Column("review_note", sa.Text, nullable=True),
        sa.Column("view_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_posts_slug", "posts", ["slug"], unique=True)
    op.create_index("ix_posts_user_id", "posts", ["user_id"])
    op.create_index("ix_posts_status", "posts", ["status"])
    op.create_index("ix_posts_published_at", "posts", ["published_at"])

    # ── videos ────────────────────────────────────────────────────────────────
    op.create_table(
        "videos",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("status", PGENUM("uploading", "processing", "ready", "failed", name="video_status", create_type=False), nullable=False, server_default="uploading"),
        sa.Column("visibility", PGENUM("public", "unlisted", "private", name="video_visibility", create_type=False), nullable=False, server_default="private"),
        sa.Column("raw_s3_key", sa.String(500), nullable=True),
        sa.Column("hls_manifest_url", sa.String(500), nullable=True),
        sa.Column("thumbnail_url", sa.String(500), nullable=True),
        sa.Column("preview_gif_url", sa.String(500), nullable=True),
        sa.Column("duration_seconds", sa.Float, nullable=True),
        sa.Column("file_size_bytes", sa.BigInteger, nullable=True),
        sa.Column("allow_comment", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("allow_embed", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("view_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_videos_user_id", "videos", ["user_id"])
    op.create_index("ix_videos_status", "videos", ["status"])
    op.create_index("ix_videos_published_at", "videos", ["published_at"])

    # ── video_qualities ───────────────────────────────────────────────────────
    op.create_table(
        "video_qualities",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("video_id", UUID(as_uuid=True), sa.ForeignKey("videos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("label", sa.String(20), nullable=False),
        sa.Column("width", sa.Integer, nullable=True),
        sa.Column("height", sa.Integer, nullable=True),
        sa.Column("bitrate", sa.Integer, nullable=True),
        sa.Column("s3_key", sa.String(500), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_video_qualities_video_id", "video_qualities", ["video_id"])

    # ── video_jobs ────────────────────────────────────────────────────────────
    op.create_table(
        "video_jobs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("video_id", UUID(as_uuid=True), sa.ForeignKey("videos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("status", PGENUM("pending", "running", "completed", "failed", name="video_job_status", create_type=False), nullable=False, server_default="pending"),
        sa.Column("progress", sa.Integer, nullable=False, server_default="0"),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("celery_task_id", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_video_jobs_video_id", "video_jobs", ["video_id"])

    # ── post_categories / post_tags ───────────────────────────────────────────
    op.create_table(
        "post_categories",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("post_id", UUID(as_uuid=True), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("category_id", UUID(as_uuid=True), sa.ForeignKey("categories.id", ondelete="CASCADE"), nullable=False),
        sa.UniqueConstraint("post_id", "category_id"),
    )
    op.create_index("ix_post_categories_post_id", "post_categories", ["post_id"])
    op.create_index("ix_post_categories_category_id", "post_categories", ["category_id"])

    op.create_table(
        "post_tags",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("post_id", UUID(as_uuid=True), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tag_id", UUID(as_uuid=True), sa.ForeignKey("tags.id", ondelete="CASCADE"), nullable=False),
        sa.UniqueConstraint("post_id", "tag_id"),
    )
    op.create_index("ix_post_tags_post_id", "post_tags", ["post_id"])
    op.create_index("ix_post_tags_tag_id", "post_tags", ["tag_id"])

    op.create_table(
        "video_categories",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("video_id", UUID(as_uuid=True), sa.ForeignKey("videos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("category_id", UUID(as_uuid=True), sa.ForeignKey("categories.id", ondelete="CASCADE"), nullable=False),
        sa.UniqueConstraint("video_id", "category_id"),
    )
    op.create_index("ix_video_categories_video_id", "video_categories", ["video_id"])
    op.create_index("ix_video_categories_category_id", "video_categories", ["category_id"])

    op.create_table(
        "video_tags",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("video_id", UUID(as_uuid=True), sa.ForeignKey("videos.id", ondelete="CASCADE"), nullable=False),
        sa.Column("tag_id", UUID(as_uuid=True), sa.ForeignKey("tags.id", ondelete="CASCADE"), nullable=False),
        sa.UniqueConstraint("video_id", "tag_id"),
    )
    op.create_index("ix_video_tags_video_id", "video_tags", ["video_id"])
    op.create_index("ix_video_tags_tag_id", "video_tags", ["tag_id"])

    # ── series ────────────────────────────────────────────────────────────────
    op.create_table(
        "series",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("slug", sa.String(350), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("cover_image_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_series_slug", "series", ["slug"], unique=True)
    op.create_index("ix_series_user_id", "series", ["user_id"])

    op.create_table(
        "series_posts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("series_id", UUID(as_uuid=True), sa.ForeignKey("series.id", ondelete="CASCADE"), nullable=False),
        sa.Column("post_id", UUID(as_uuid=True), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("position", sa.Integer, nullable=False, server_default="0"),
        sa.UniqueConstraint("series_id", "post_id"),
    )
    op.create_index("ix_series_posts_series_id", "series_posts", ["series_id"])
    op.create_index("ix_series_posts_post_id", "series_posts", ["post_id"])

    # ── media ─────────────────────────────────────────────────────────────────
    op.create_table(
        "media",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("filename", sa.String(300), nullable=False),
        sa.Column("original_url", sa.String(500), nullable=False),
        sa.Column("webp_url", sa.String(500), nullable=True),
        sa.Column("thumbnail_url", sa.String(500), nullable=True),
        sa.Column("mime_type", sa.String(100), nullable=False),
        sa.Column("file_size_bytes", sa.BigInteger, nullable=True),
        sa.Column("width", sa.Integer, nullable=True),
        sa.Column("height", sa.Integer, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_media_user_id", "media", ["user_id"])

    # ── comments ─────────────────────────────────────────────────────────────
    op.create_table(
        "comments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("content_type", PGENUM("post", "video", name="comment_content_type", create_type=False), nullable=False),
        sa.Column("content_id", UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("parent_id", UUID(as_uuid=True), sa.ForeignKey("comments.id", ondelete="CASCADE"), nullable=True),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("edited_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_comments_content_type", "comments", ["content_type"])
    op.create_index("ix_comments_content_id", "comments", ["content_id"])
    op.create_index("ix_comments_user_id", "comments", ["user_id"])
    op.create_index("ix_comments_parent_id", "comments", ["parent_id"])

    # ── reactions ────────────────────────────────────────────────────────────
    op.create_table(
        "reactions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("content_type", PGENUM("post", "video", "comment", name="reaction_content_type", create_type=False), nullable=False),
        sa.Column("content_id", UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("emoji", sa.String(10), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("content_type", "content_id", "user_id", "emoji", name="uq_reactions"),
    )
    op.create_index("ix_reactions_content_type", "reactions", ["content_type"])
    op.create_index("ix_reactions_content_id", "reactions", ["content_id"])
    op.create_index("ix_reactions_user_id", "reactions", ["user_id"])

    # ── bookmarks ────────────────────────────────────────────────────────────
    op.create_table(
        "bookmarks",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("content_type", PGENUM("post", "video", name="bookmark_content_type", create_type=False), nullable=False),
        sa.Column("content_id", UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "content_type", "content_id", name="uq_bookmarks"),
    )
    op.create_index("ix_bookmarks_user_id", "bookmarks", ["user_id"])
    op.create_index("ix_bookmarks_content_type", "bookmarks", ["content_type"])
    op.create_index("ix_bookmarks_content_id", "bookmarks", ["content_id"])

    # ── reports ───────────────────────────────────────────────────────────────
    op.create_table(
        "reports",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("reporter_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("content_type", sa.String(50), nullable=False),
        sa.Column("content_id", UUID(as_uuid=True), nullable=False),
        sa.Column("reason", sa.String(100), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("status", PGENUM("pending", "reviewed", "dismissed", "actioned", name="report_status", create_type=False), nullable=False, server_default="pending"),
        sa.Column("reviewed_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_reports_reporter_id", "reports", ["reporter_id"])
    op.create_index("ix_reports_content_id", "reports", ["content_id"])
    op.create_index("ix_reports_status", "reports", ["status"])

    # ── moderation_actions ────────────────────────────────────────────────────
    op.create_table(
        "moderation_actions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("moderator_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("target_user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action_type", PGENUM("warn", "mute", "restrict", "suspend", "ban", "delete_content", "restore_content", name="moderation_action_type", create_type=False), nullable=False),
        sa.Column("reason", sa.Text, nullable=True),
        sa.Column("content_type", sa.String(50), nullable=True),
        sa.Column("content_id", UUID(as_uuid=True), nullable=True),
        sa.Column("report_id", UUID(as_uuid=True), sa.ForeignKey("reports.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_moderation_actions_moderator_id", "moderation_actions", ["moderator_id"])
    op.create_index("ix_moderation_actions_target_user_id", "moderation_actions", ["target_user_id"])

    # ── user_warnings ─────────────────────────────────────────────────────────
    op.create_table(
        "user_warnings",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("issued_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reason", sa.Text, nullable=False),
        sa.Column("acknowledged", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_user_warnings_user_id", "user_warnings", ["user_id"])

    # ── notifications ─────────────────────────────────────────────────────────
    op.create_table(
        "notifications",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", sa.String(100), nullable=False),
        sa.Column("actor_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("content_type", sa.String(50), nullable=True),
        sa.Column("content_id", UUID(as_uuid=True), nullable=True),
        sa.Column("payload_json", sa.JSON, nullable=True),
        sa.Column("read", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])
    op.create_index("ix_notifications_read", "notifications", ["read"])
    op.create_index("ix_notifications_created_at", "notifications", ["created_at"])

    # ── content_views ─────────────────────────────────────────────────────────
    op.create_table(
        "content_views",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("content_type", sa.String(50), nullable=False),
        sa.Column("content_id", UUID(as_uuid=True), nullable=False),
        sa.Column("viewer_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("ip_hash", sa.String(64), nullable=True),
        sa.Column("user_agent", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_content_views_content_type", "content_views", ["content_type"])
    op.create_index("ix_content_views_content_id", "content_views", ["content_id"])
    op.create_index("ix_content_views_created_at", "content_views", ["created_at"])

    # ── contact_messages ──────────────────────────────────────────────────────
    op.create_table(
        "contact_messages",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("subject", sa.String(300), nullable=True),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("read", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("contact_messages")
    op.drop_table("content_views")
    op.drop_table("notifications")
    op.drop_table("user_warnings")
    op.drop_table("moderation_actions")
    op.drop_table("reports")
    op.drop_table("bookmarks")
    op.drop_table("reactions")
    op.drop_table("comments")
    op.drop_table("media")
    op.drop_table("series_posts")
    op.drop_table("series")
    op.drop_table("video_tags")
    op.drop_table("video_categories")
    op.drop_table("post_tags")
    op.drop_table("post_categories")
    op.drop_table("video_jobs")
    op.drop_table("video_qualities")
    op.drop_table("videos")
    op.drop_table("posts")
    op.drop_table("projects")
    op.drop_table("experiences")
    op.drop_table("skills")
    op.drop_table("portfolio_profiles")
    op.drop_table("tag_follows")
    op.drop_table("tags")
    op.drop_table("categories")
    op.drop_table("follows")
    op.drop_table("user_storage_usage")
    op.drop_table("user_settings")
    op.drop_table("refresh_tokens")
    op.drop_table("oauth_accounts")
    op.drop_table("users")

    bind = op.get_bind()
    PGENUM(name="moderation_action_type").drop(bind, checkfirst=True)
    PGENUM(name="report_status").drop(bind, checkfirst=True)
    PGENUM(name="bookmark_content_type").drop(bind, checkfirst=True)
    PGENUM(name="reaction_content_type").drop(bind, checkfirst=True)
    PGENUM(name="comment_content_type").drop(bind, checkfirst=True)
    PGENUM(name="video_job_status").drop(bind, checkfirst=True)
    PGENUM(name="video_visibility").drop(bind, checkfirst=True)
    PGENUM(name="video_status").drop(bind, checkfirst=True)
    PGENUM(name="post_status").drop(bind, checkfirst=True)
    PGENUM(name="post_type").drop(bind, checkfirst=True)
    PGENUM(name="user_status").drop(bind, checkfirst=True)
    PGENUM(name="user_role").drop(bind, checkfirst=True)
