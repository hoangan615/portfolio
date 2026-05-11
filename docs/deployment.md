# Production Deployment Guide

This guide covers deploying to a VPS or cloud VM using Docker Compose.

---

## Pre-Deployment Checklist

- [ ] Set strong `SECRET_KEY` (32+ random chars)
- [ ] Configure real OAuth credentials (Google, GitHub)
- [ ] Configure SMTP or SendGrid for production email
- [ ] Set up S3 bucket (AWS S3 or MinIO on separate server)
- [ ] Configure CDN (CloudFront or Cloudflare) for media
- [ ] Set up PostgreSQL backup strategy
- [ ] Enable HTTPS (Certbot / Let's Encrypt)
- [ ] Set `APP_ENV=production`, `DEBUG=false`

---

## Environment Variables (Production)

```bash
# Change these for production:
APP_ENV=production
DEBUG=false
SECRET_KEY=<generate: python -c "import secrets; print(secrets.token_hex(32))">
ALLOWED_HOSTS=["https://yourdomain.com"]

# Database (use managed DB for production)
DATABASE_URL=postgresql+asyncpg://user:pass@db-host:5432/portfolio_db

# Redis (use managed Redis)
REDIS_URL=redis://:password@redis-host:6379/0

# S3 (AWS S3 recommended for production)
S3_ENDPOINT_URL=https://s3.amazonaws.com
S3_ACCESS_KEY_ID=<aws-access-key>
S3_SECRET_ACCESS_KEY=<aws-secret-key>
S3_BUCKET_NAME=your-bucket-name
S3_REGION=ap-southeast-1
S3_PUBLIC_URL=https://your-bucket.s3.ap-southeast-1.amazonaws.com

# Email (SMTP or SendGrid)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<sendgrid-api-key>
SMTP_TLS=true
FROM_EMAIL=noreply@yourdomain.com

# OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GITHUB_CLIENT_ID=<your-github-client-id>
GITHUB_CLIENT_SECRET=<your-github-client-secret>
OAUTH_REDIRECT_URL=https://yourdomain.com/auth/callback

FRONTEND_URL=https://yourdomain.com
```

---

## Docker Compose Production Setup

Create `docker-compose.prod.yml`:

```yaml
version: "3.9"
services:
  api:
    image: ghcr.io/hoangan615/portfolio-api:latest
    restart: always
    env_file: .env.prod
    command: gunicorn main:app --worker-class uvicorn.workers.UvicornWorker --workers 4 --bind 0.0.0.0:8000

  web:
    image: ghcr.io/hoangan615/portfolio-web:latest
    restart: always

  worker:
    image: ghcr.io/hoangan615/portfolio-worker:latest
    restart: always
    command: celery -A worker worker --loglevel=warning --concurrency=2

  nginx:
    image: nginx:1.27-alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infra/nginx:/etc/nginx:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - certbot-webroot:/var/www/certbot
```

---

## HTTPS with Let's Encrypt

```bash
# Install Certbot
apt install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renew (add to crontab)
0 12 * * * certbot renew --quiet
```

Update `infra/nginx/conf.d/default.conf` to add HTTPS server block.

---

## Database Backups

```bash
# Manual backup
docker exec portfolio_postgres pg_dump -U postgres portfolio_db | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore
gunzip -c backup_20260101.sql.gz | docker exec -i portfolio_postgres psql -U postgres portfolio_db

# Automated (add to crontab)
0 2 * * * docker exec portfolio_postgres pg_dump -U postgres portfolio_db | gzip > /backups/portfolio_$(date +\%Y\%m\%d).sql.gz
```

---

## Performance Tuning

**API Workers:**
```bash
# Formula: 2 * CPU_cores + 1
gunicorn --workers 5 --worker-class uvicorn.workers.UvicornWorker
```

**PostgreSQL:**
- Use connection pooling (PgBouncer) for high traffic
- Enable pg_trgm extension: `CREATE EXTENSION pg_trgm;`

**Redis:**
- Set `maxmemory` and `maxmemory-policy allkeys-lru`

**CDN:**
- Serve all `/media/*` paths through CloudFront or Cloudflare
- Cache HLS segments for 1 hour
- Cache thumbnails for 24 hours

---

## Monitoring

- **Sentry**: Set `SENTRY_DSN` in `.env` for error tracking
- **Logs**: All services log to stdout (captured by Docker)
- **Celery**: Flower UI at port 5555
- **Health check**: `GET /health` → `{"status": "ok"}`
