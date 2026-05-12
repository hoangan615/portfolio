# API Reference

Base URL: `http://localhost:8000/api/v1`

Interactive docs: `http://localhost:8000/docs` (Swagger UI)

---

## Authentication

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | — | Create account |
| `POST` | `/auth/login` | — | Login (returns access token + sets cookie) |
| `POST` | `/auth/refresh` | Cookie | Refresh access token |
| `POST` | `/auth/logout` | Auth | Revoke refresh token |
| `POST` | `/auth/forgot-password` | — | Send password reset email |
| `POST` | `/auth/reset-password` | — | Reset password with token |
| `GET` | `/auth/verify-email?token=` | — | Verify email address |
| `GET` | `/auth/google` | — | Start Google OAuth |
| `GET` | `/auth/google/callback` | — | Google OAuth callback |
| `GET` | `/auth/github` | — | Start GitHub OAuth |
| `GET` | `/auth/github/callback` | — | GitHub OAuth callback |

### Token Flow
- `POST /auth/login` → returns `{ access_token }` + sets `refresh_token` HttpOnly cookie
- Include `Authorization: Bearer <access_token>` on all authenticated requests
- On 401, call `POST /auth/refresh` (sends cookie automatically) to get new access token

---

## Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/users/me` | Auth | Current user's private profile |
| `PATCH` | `/users/me` | Auth | Update profile |
| `POST` | `/users/me/avatar` | Auth | Upload avatar |
| `DELETE` | `/users/me` | Auth | Delete account (soft) |
| `GET` | `/users/me/bookmarks` | Auth | Saved content |
| `GET` | `/users/:username` | — | Public profile |
| `GET` | `/users/:username/posts` | — | User's posts |
| `GET` | `/users/:username/videos` | — | User's videos |
| `GET` | `/users/:username/followers` | — | Follower list |
| `GET` | `/users/:username/following` | — | Following list |
| `POST` | `/users/:username/follow` | Member+ | Follow user |
| `DELETE` | `/users/:username/follow` | Member+ | Unfollow user |

---

## Feed

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/feed` | Auth | Following + tag feed |
| `GET` | `/feed/global` | — | All published content |
| `GET` | `/feed/trending` | — | Top 24h by engagement |
| `GET` | `/feed/explore` | Optional | Personalized discover |

Query params: `page`, `per_page`

---

## Posts

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/posts` | — | List posts (filterable) |
| `POST` | `/posts` | Member+ | Create post |
| `GET` | `/posts/:slug` | — | Get post by slug |
| `PUT` | `/posts/:id` | Owner/Mod | Update post |
| `DELETE` | `/posts/:id` | Owner/Mod | Delete post |

Query params: `type`, `category`, `tag`, `q`, `author`, `page`

**Post types:** `article`, `short`, `gallery`, `til`

**Post status flow:**
```
draft → pending_review → published (new member, < 5 posts)
draft → published (trusted member, 5+ posts)
```

---

## Videos

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/videos` | — | List videos |
| `POST` | `/videos/upload/init` | Member+ | Get presigned S3 URL |
| `GET` | `/videos/upload/status/:job_id` | Auth | Processing progress (SSE) |
| `POST` | `/videos/upload/complete` | Auth | Finalize upload |
| `GET` | `/videos/:id` | — | Get video |
| `PUT` | `/videos/:id` | Owner/Mod | Update metadata |
| `DELETE` | `/videos/:id` | Owner/Mod | Delete video |

---

## Media

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/media/upload` | Member+ | Upload images (multipart) |
| `GET` | `/media` | Auth | Own media library |
| `DELETE` | `/media/:id` | Auth | Delete media |

---

## Comments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/posts/:id/comments` | — | Post comments |
| `POST` | `/posts/:id/comments` | Member+ | Add comment |
| `GET` | `/videos/:id/comments` | — | Video comments |
| `POST` | `/videos/:id/comments` | Member+ | Add comment |
| `PUT` | `/comments/:id` | Auth | Edit (15 min window) |
| `DELETE` | `/comments/:id` | Auth/Mod | Delete comment |

---

## Reactions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/posts/:id/react` | Member+ | Add reaction `{ emoji }` |
| `DELETE` | `/posts/:id/react` | Member+ | Remove reaction |
| `POST` | `/videos/:id/react` | Member+ | Add reaction |
| `DELETE` | `/videos/:id/react` | Member+ | Remove reaction |
| `POST` | `/bookmarks` | Member+ | Save content |
| `DELETE` | `/bookmarks/:id` | Auth | Remove bookmark |

Supported emojis: `❤️ 👏 🔥 💡 🤔 😂`

---

## Notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/notifications` | Auth | List notifications |
| `PUT` | `/notifications/read-all` | Auth | Mark all read |
| `PUT` | `/notifications/:id/read` | Auth | Mark one read |

---

## Search

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/search` | — | Search all content |

Query params: `q` (required), `type` (post/video/user), `category`, `tag`, `page`

---

## Tags

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/tags/trending` | — | Trending tags |
| `GET` | `/tags/:slug` | — | Tag info |
| `GET` | `/tags/:slug/feed` | — | Content by tag |
| `POST` | `/tags/:slug/follow` | Member+ | Follow tag |
| `DELETE` | `/tags/:slug/follow` | Member+ | Unfollow tag |

---

## Portfolio

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/portfolio` | — | Get owner portfolio |
| `PUT` | `/portfolio` | Owner | Update portfolio |
| `GET/POST/PUT/DELETE` | `/portfolio/skills` | Owner | Skills CRUD |
| `GET/POST/PUT/DELETE` | `/portfolio/experiences` | Owner | Experience CRUD |
| `GET/POST/PUT/DELETE` | `/portfolio/projects` | Owner | Projects CRUD |
| `POST` | `/contact` | — | Send contact message |

---

## Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/admin/analytics` | Admin+ | Platform stats |
| `GET` | `/admin/users` | Admin+ | User list |
| `PUT` | `/admin/users/:id/role` | Admin+ | Change role |
| `POST` | `/admin/users/:id/warn` | Admin+ | Warn user |
| `PUT` | `/admin/users/:id/status` | Admin+ | Restrict/ban user |
| `GET` | `/admin/moderation/reports` | Mod+ | Report queue |
| `PUT` | `/admin/moderation/reports/:id` | Mod+ | Handle report |
| `GET` | `/admin/content/pending` | Mod+ | Review queue |
| `PUT` | `/admin/content/:type/:id/approve` | Mod+ | Approve content |
| `PUT` | `/admin/content/:type/:id/reject` | Mod+ | Reject + note |
| `GET/PUT` | `/admin/settings` | Owner | System settings |

---

## Common Response Formats

```json
// Paged response
{
  "items": [...],
  "total": 100,
  "page": 1,
  "per_page": 20,
  "has_next": true
}

// Error response
{
  "detail": "Error message",
  "code": "NOT_FOUND"
}
```

## Rate Limits

| Action | Limit |
|--------|-------|
| Default | 60 req/min |
| Login attempts | 5 failures → 15 min lockout |
| Post creation | 5 posts/hour/user |
| Comments | 30 comments/hour/user |
| Video upload | Based on role (2–5 per day) |
