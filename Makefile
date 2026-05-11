.PHONY: dev build down logs migrate seed shell-api shell-db shell-worker \
        ps restart pull lint test clean help

# ── Docker Compose shortcuts ───────────────────────────────────────────────────

## Start all services (detached)
dev:
	docker compose up -d
	@echo ""
	@echo "Services started:"
	@echo "  App        → http://localhost"
	@echo "  API docs   → http://localhost:8000/docs"
	@echo "  MinIO UI   → http://localhost:9001  (minioadmin / minioadmin)"
	@echo "  Mailhog    → http://localhost:8025"
	@echo "  Flower     → http://localhost:5555"

## Start services in foreground (shows logs)
dev-fg:
	docker compose up

## Build all Docker images
build:
	docker compose build

## Build without cache
build-no-cache:
	docker compose build --no-cache

## Stop and remove containers (keeps volumes)
down:
	docker compose down

## Stop and remove containers AND volumes (destructive!)
down-volumes:
	@echo "WARNING: This will delete all persistent data (DB, Redis, MinIO)."
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ]
	docker compose down -v

## Tail logs for all services
logs:
	docker compose logs -f

## Tail logs for a specific service: make logs-SERVICE (e.g. make logs-api)
logs-%:
	docker compose logs -f $*

## Show running containers
ps:
	docker compose ps

## Restart a specific service: make restart-SERVICE (e.g. make restart-api)
restart-%:
	docker compose restart $*

## Pull latest base images
pull:
	docker compose pull

# ── Database ───────────────────────────────────────────────────────────────────

## Run pending Alembic migrations
migrate:
	docker compose exec api alembic upgrade head

## Roll back the last migration
migrate-down:
	docker compose exec api alembic downgrade -1

## Show current migration revision
migrate-current:
	docker compose exec api alembic current

## Seed initial data (owner account, categories, etc.)
seed:
	docker compose exec api python seed.py

## Create a new Alembic migration (usage: make migration MSG="add users table")
migration:
	docker compose exec api alembic revision --autogenerate -m "$(MSG)"

# ── Shell access ───────────────────────────────────────────────────────────────

## Open a shell inside the API container
shell-api:
	docker compose exec api bash

## Open a shell inside the worker container
shell-worker:
	docker compose exec worker bash

## Connect to PostgreSQL via psql
shell-db:
	docker compose exec postgres psql -U postgres -d portfolio_db

## Connect to Redis CLI
shell-redis:
	docker compose exec redis redis-cli

## Open MinIO CLI shell
shell-minio:
	docker compose exec minio sh

# ── Development utilities ──────────────────────────────────────────────────────

## Run API tests
test:
	docker compose exec api pytest tests/ -v --tb=short

## Run API tests with coverage
test-cov:
	docker compose exec api pytest tests/ --cov=. --cov-report=html --cov-report=term

## Lint Python code (ruff + black check)
lint:
	docker compose exec api ruff check .
	docker compose exec api black --check .

## Format Python code
fmt:
	docker compose exec api ruff check --fix .
	docker compose exec api black .

## Create MinIO bucket (run once after first start)
minio-setup:
	docker compose exec minio mc alias set local http://localhost:9000 minioadmin minioadmin
	docker compose exec minio mc mb --ignore-existing local/portfolio-media
	docker compose exec minio mc anonymous set download local/portfolio-media

## Install JS dependencies (runs outside Docker, for local IDE support)
install:
	pnpm install

## Full clean: remove containers, volumes, images, and JS deps
clean:
	docker compose down -v --rmi local
	rm -rf node_modules apps/web/node_modules packages/*/node_modules

# ── Help ───────────────────────────────────────────────────────────────────────

help:
	@echo ""
	@echo "Portfolio Platform — Make targets"
	@echo "=================================="
	@grep -E '^##' Makefile | sed 's/^## /  /'
	@echo ""
