# Prompt Lib

Prompt Lib is a full-stack LLM prompt catalog built as a small monorepo.

- Frontend: Next.js, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Axum, SeaORM, PostgreSQL
- Auth: JWT stored in an HTTP-only cookie
- Data model: categories, prompts, LLM frameworks, LLM models, and review runs

## Repository Layout

```text
apps/
  api/    Rust API and backend-local SeaORM migrator
  web/    Next.js frontend
scripts/  Local development helpers
.github/  CI/CD workflows for version tags and GHCR images
```

## Features

- User registration and login
- Prompt categories owned by authenticated users
- Prompt creation and listing
- LLM framework creation
- LLM model creation with a one-to-many relationship from framework to model
- Prompt reviews linked to a concrete LLM model and its thinking effort
- SeaORM migrations executed on startup and available through a CLI wrapper
- Docker images for both frontend and backend
- GitHub Actions for semantic version tagging and publishing images to GHCR

## Requirements

- Rust and Cargo
- Node.js 22+
- pnpm
- Docker
- `cargo-watch` for the source-based dev loop
- `openssl` for generating local secrets in `scripts/init`
- `direnv` is optional but useful because `.envrc` adds the local scripts to `PATH`

Install `cargo-watch` if you do not already have it:

```bash
cargo install cargo-watch
```

## Environment Setup

Create a local `.env` file from `.env.example`:

```bash
./scripts/init
```

To overwrite an existing `.env`:

```bash
./scripts/init --force
```

If you use `direnv`, allow the repo once:

```bash
direnv allow
```

This makes the scripts in `scripts/` available directly in your shell.

## Local Development

Start PostgreSQL, the API, and the frontend:

```bash
./scripts/start-all
```

Stop everything:

```bash
./scripts/stop-all
```

Restart everything:

```bash
./scripts/restart-all
```

By default the services run at:

- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- PostgreSQL: `localhost:5432`

The start script writes logs to:

- `.logs/api.log`
- `.logs/web.log`

## Package Scripts

Root-level scripts:

```bash
pnpm run dev:web
pnpm run build:web
pnpm run lint:web

pnpm run dev:api
pnpm run check:api
```

## Database Migrations

Migrations live inside the backend at `apps/backend/src/migration`.

The API applies pending migrations automatically on startup.

You can also run migrations explicitly from the repo root:

```bash
pnpm run migrate -- up
pnpm run migrate -- status
pnpm run migrate -- down
pnpm run migrate -- fresh
```

There are also fixed shortcuts:

```bash
pnpm run migrate:up
pnpm run migrate:status
pnpm run migrate:down
pnpm run migrate:fresh
```

## Docker

Dockerfiles are provided for both apps:

- `apps/frontend-web/Dockerfile`
- `apps/backend/Dockerfile`

Build the frontend image:

```bash
cd apps/frontend-web
docker build -t prompt-lib-frontend-web:test .
```

Build the backend image from the repo root:

```bash
docker build -f apps/backend/Dockerfile -t prompt-lib-backend:test .
```

The backend container exposes port `4000` and binds to `0.0.0.0` by default.

The frontend container exposes port `3000` and runs the Next.js standalone server.

## GitHub Actions

### Version Tags

`create-version-tag.yml` runs on every push to `main` and creates a new semver tag.

Version bump rules:

- `feat!:` or `feat(scope)!:` -> major bump
- `feat:` or `feat(scope):` -> minor bump
- anything else -> patch bump

When a major version is bumped, minor and patch reset to `0`.

When a minor version is bumped, patch resets to `0`.

### Image Publishing

`publish-images.yml` runs only after the `Create Version Tag` workflow completes successfully and resolves the semver tag created for that commit.

It publishes both images to GitHub Container Registry:

- `ghcr.io/benedikt-weyer/prompt-lib-frontend-web:<tag>`
- `ghcr.io/benedikt-weyer/prompt-lib-backend:<tag>`

The published container tag matches the Git tag name exactly.

## Current Domain Model

- A user can create categories
- A user can create prompts in a category
- A user can create LLM frameworks
- An LLM framework has many LLM models
- Each LLM model carries a linked thinking effort
- A prompt can have many review runs
- Each review run references a single LLM model and stores a star rating from 1 to 10

## Notes

- The frontend currently uses the backend API directly via `NEXT_PUBLIC_API_URL`.
- The backend expects PostgreSQL via `DATABASE_URL`.
- GitHub image publishing uses `GITHUB_TOKEN`, so package publishing permissions must remain enabled in the workflow.