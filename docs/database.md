# Database Schema

PostgreSQL 16. All IDs are UUID v4. Timestamps are stored with timezone.

---

## Users & Auth

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| username | VARCHAR(50) UNIQUE | Alphanumeric + underscore/dash |
| email | VARCHAR(255) UNIQUE | |
| password_hash | VARCHAR(255) | NULL for OAuth-only accounts |
| display_name | VARCHAR(100) | |
| avatar_url | VARCHAR(500) | S3/MinIO URL |
| cover_url | VARCHAR(500) | |
| bio | TEXT | |
| role | ENUM | owner/admin/moderator/member/restricted/banned |
| status | ENUM | active/pending/suspended/deleted |
| email_verified | BOOLEAN | false until email click |
| follower_count | INTEGER | Denormalized counter |
| following_count | INTEGER | Denormalized counter |
| post_count | INTEGER | Denormalized counter |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### `oauth_accounts`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK users | |
| provider | VARCHAR(20) | google / github |
| provider_id | VARCHAR(255) | |
| provider_email | VARCHAR(255) | |

### `refresh_tokens`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK users | |
| token_hash | VARCHAR(255) | Hashed token |
| expires_at | TIMESTAMPTZ | |
| revoked | BOOLEAN | |
| created_at | TIMESTAMPTZ | |

### `user_settings`
| Column | Type | Notes |
|--------|------|-------|
| user_id | UUID PK FK users | |
| email_on_comment | BOOLEAN | default true |
| email_on_follow | BOOLEAN | |
| email_on_like | BOOLEAN | |
| email_digest | BOOLEAN | |
| interest_tags | TEXT[] | Tag slugs for feed personalization |

### `user_storage_usage`
| Column | Type |
|--------|------|
| user_id | UUID PK FK users |
| used_bytes | BIGINT |
| video_count | INTEGER |
| image_count | INTEGER |
| updated_at | TIMESTAMPTZ |

---

## Social

### `follows`
| Column | Type |
|--------|------|
| follower_id | UUID FK users |
| following_id | UUID FK users |
| created_at | TIMESTAMPTZ |

PK: (follower_id, following_id)

### `tag_follows`
| Column | Type |
|--------|------|
| user_id | UUID FK users |
| tag_id | UUID FK tags |
| created_at | TIMESTAMPTZ |

---

## Portfolio (owner-only)

### `portfolio_profiles`
| Column | Type |
|--------|------|
| id | UUID PK |
| user_id | UUID FK users UNIQUE |
| headline | VARCHAR(255) |
| about | TEXT |
| cv_url | VARCHAR(500) |
| updated_at | TIMESTAMPTZ |

### `skills`
| Column | Type |
|--------|------|
| id | UUID PK |
| user_id | UUID FK users |
| name | VARCHAR(100) |
| category | VARCHAR(100) |
| level | INTEGER (1-100) |
| icon_url | VARCHAR(500) |
| sort_order | INTEGER |

### `experiences`
| Column | Type |
|--------|------|
| id | UUID PK |
| user_id | UUID FK users |
| type | ENUM work/education |
| company | VARCHAR(255) |
| title | VARCHAR(255) |
| location | VARCHAR(255) |
| start_date | DATE |
| end_date | DATE (nullable) |
| description | TEXT |
| logo_url | VARCHAR(500) |

### `projects`
| Column | Type |
|--------|------|
| id | UUID PK |
| user_id | UUID FK users |
| title | VARCHAR(255) |
| description | TEXT |
| tech_stack | TEXT[] |
| thumbnail_url | VARCHAR(500) |
| repo_url | VARCHAR(500) |
| live_url | VARCHAR(500) |
| featured | BOOLEAN |
| sort_order | INTEGER |

---

## Content

### `posts`
| Column | Type |
|--------|------|
| id | UUID PK |
| user_id | UUID FK users |
| type | ENUM article/short/gallery/til |
| title | VARCHAR(500) |
| slug | VARCHAR(500) UNIQUE |
| content | TEXT |
| excerpt | TEXT |
| cover_image_url | VARCHAR(500) |
| status | ENUM draft/pending_review/published/rejected/archived |
| review_note | TEXT |
| view_count | INTEGER |
| published_at | TIMESTAMPTZ |
| scheduled_at | TIMESTAMPTZ |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

### `videos`
| Column | Type |
|--------|------|
| id | UUID PK |
| user_id | UUID FK users |
| title | VARCHAR(500) |
| description | TEXT |
| status | ENUM uploading/processing/ready/failed |
| visibility | ENUM public/unlisted/private |
| raw_s3_key | VARCHAR(500) |
| hls_manifest_url | VARCHAR(500) |
| thumbnail_url | VARCHAR(500) |
| preview_gif_url | VARCHAR(500) |
| duration_seconds | INTEGER |
| file_size_bytes | BIGINT |
| allow_comment | BOOLEAN |
| allow_embed | BOOLEAN |
| view_count | INTEGER |
| published_at | TIMESTAMPTZ |
| created_at | TIMESTAMPTZ |
| updated_at | TIMESTAMPTZ |

### `video_qualities`
| Column | Type |
|--------|------|
| id | UUID PK |
| video_id | UUID FK videos |
| quality_label | VARCHAR(10) |
| hls_playlist_url | VARCHAR(500) |
| file_size_bytes | BIGINT |

### `video_jobs`
| Column | Type |
|--------|------|
| id | UUID PK |
| video_id | UUID FK videos |
| status | VARCHAR(50) |
| progress | INTEGER (0-100) |
| error_message | TEXT |
| started_at | TIMESTAMPTZ |
| completed_at | TIMESTAMPTZ |
| created_at | TIMESTAMPTZ |

### `categories`, `tags`
Standard lookup tables with name, slug, description.

### `post_categories`, `post_tags`, `video_tags`, `video_categories`
Junction tables (content_id FK, category/tag_id FK).

---

## Media

### `media`
| Column | Type |
|--------|------|
| id | UUID PK |
| user_id | UUID FK users |
| filename | VARCHAR(255) |
| original_url | VARCHAR(500) |
| webp_url | VARCHAR(500) |
| thumbnail_url | VARCHAR(500) |
| mime_type | VARCHAR(100) |
| file_size_bytes | BIGINT |
| width | INTEGER |
| height | INTEGER |
| created_at | TIMESTAMPTZ |

---

## Interactions

### `comments`
| Column | Type |
|--------|------|
| id | UUID PK |
| content_type | ENUM post/video |
| content_id | UUID |
| user_id | UUID FK users |
| parent_id | UUID FK comments (nullable) |
| body | TEXT |
| edited_at | TIMESTAMPTZ |
| deleted_at | TIMESTAMPTZ (soft delete) |
| created_at | TIMESTAMPTZ |

### `reactions`
| Column | Type |
|--------|------|
| id | UUID PK |
| content_type | ENUM post/video/comment |
| content_id | UUID |
| user_id | UUID FK users |
| emoji | VARCHAR(10) |
| created_at | TIMESTAMPTZ |

UNIQUE: (content_type, content_id, user_id, emoji)

### `bookmarks`
| Column | Type |
|--------|------|
| id | UUID PK |
| user_id | UUID FK users |
| content_type | ENUM post/video |
| content_id | UUID |
| created_at | TIMESTAMPTZ |

UNIQUE: (user_id, content_type, content_id)

---

## Moderation

### `reports`
Tracks user reports with reason, status (pending/reviewed/dismissed), and reviewer.

### `moderation_actions`
Audit log of moderator actions (hide, delete, warn, restrict, ban).

### `user_warnings`
Warning messages issued to users by moderators/admins.

---

## Notifications

### `notifications`
| Column | Type |
|--------|------|
| id | UUID PK |
| user_id | UUID FK users |
| type | VARCHAR(50) |
| actor_id | UUID FK users (nullable) |
| content_type | VARCHAR(20) |
| content_id | UUID |
| payload_json | JSONB |
| read | BOOLEAN |
| created_at | TIMESTAMPTZ |

---

## Analytics

### `content_views`
Partitioned by date. Tracks content views with optional viewer_id, ip_hash, user_agent.

### `contact_messages`
Form submissions from portfolio contact form.
