# Backend storage & local development

Where the backend persists data, and how to keep local development fully
isolated from production. Everything here defaults to **local** so a fresh
checkout needs no cloud credentials.

## Summary of switches

| Concern            | Env flag            | `local` (default)                          | `s3` / remote                         |
|--------------------|---------------------|--------------------------------------------|---------------------------------------|
| Database           | `MONGO_URI`         | `mongodb://127.0.0.1:27017/...` (Docker)   | Atlas cluster                         |
| Cache / sessions   | `REDIS_HOST/PORT`   | `127.0.0.1:6379` (Docker)                  | remote Redis                          |
| File/media uploads | `FILE_STORAGE`      | saves to `uploaded-docs/`, served `/api/file` | AWS S3 (`AWS_ENABLED=true`)        |
| Template bundles   | `TEMPLATE_STORAGE`  | saves to `uploaded-docs/templates/`        | AWS S3 (`AWS_ENABLED=true`)           |

## Database & cache (MongoDB + Redis)

Local MongoDB and Redis run via `docker-compose.local.yml` so development never
reads or writes the production Atlas cluster.

```bash
# from the backend project root
docker compose --env-file /dev/null -f docker-compose.local.yml up -d    # start
docker compose --env-file /dev/null -f docker-compose.local.yml stop     # stop
docker compose --env-file /dev/null -f docker-compose.local.yml down     # remove (keeps data)
docker compose --env-file /dev/null -f docker-compose.local.yml down -v  # remove + wipe data
```

`--env-file /dev/null` is needed because the app `.env` uses `;`-style comments,
which Docker Compose's env parser rejects. The compose file itself uses no
variables, so ignoring the app `.env` is safe.

`.env` points at local by default:

```dotenv
MONGO_URI=mongodb://127.0.0.1:27017/Cuprous
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=redispass
```

The production Atlas URI is kept commented directly below `MONGO_URI` for an
easy switch back. Local Mongo starts empty and self-seeds the admin account and
default tags on first boot.

## File & media uploads (`FILE_STORAGE`)

Generic uploads go through `POST /api/file` (`UploadService`).

```dotenv
FILE_STORAGE=local   # default: write to uploaded-docs/<folder>/, return a
                     #          {SERVER_DOMAIN}/api/file/... URL
FILE_STORAGE=s3      # upload to AWS S3 (needs AWS_ENABLED=true + credentials)
```

In `local` mode files are written under `uploaded-docs/` and served by the
static handler mounted at `/api/file` in `main.ts`, so uploaded files are
immediately retrievable at the returned URL — no AWS account required.

> Historical note: before this flag, `UploadService.uploadFile` only supported
> S3 and silently returned `undefined` when `AWS_ENABLED=false`, so generic
> uploads no-oped in local dev. `FILE_STORAGE=local` fixes that.

## Template bundles (`TEMPLATE_STORAGE`)

Hosted template bundles are handled by `TemplateStorageService`.

```dotenv
TEMPLATE_STORAGE=local   # default: write to uploaded-docs/templates/, serve /api/file
TEMPLATE_STORAGE=s3      # deploy to AWS S3 (needs AWS_ENABLED=true + credentials)
```

## Enabling S3 for production

Both storage switches route to S3 through the shared AWS settings:

```dotenv
AWS_ENABLED=true
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-south-1
AWS_S3_BUCKET=...
FILE_STORAGE=s3
TEMPLATE_STORAGE=s3
```

If `FILE_STORAGE=s3` or `TEMPLATE_STORAGE=s3` but AWS is not configured, uploads
fail fast with a 503 explaining how to fix it, rather than silently no-oping.

## What still leaves the machine in local mode

Even with all storage local, some features call external services when
configured/used: the AI service (`AI_URL`, may call OpenAI), Google input tools
in the widget, `ip-api.com` for visitor geo-lookup, and any configured mail /
Telegram / WhatsApp / Facebook integrations. None of these run unless the
corresponding feature is exercised.
