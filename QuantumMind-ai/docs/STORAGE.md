# Milvus storage backend — local MinIO vs AWS S3

Milvus stores its vector segments in an S3-compatible object store. This service
can point that store at either a **local MinIO container** (development) or the
**production AWS S3 bucket**. The switch is a single flag in `.env`:

```dotenv
ENABLE_MILVUS_S3=false   # local MinIO (default) — never touches production
ENABLE_MILVUS_S3=true    # production AWS S3 bucket (jarcube-milvus-data)
```

## Why this exists

By default Milvus was configured to read and write the production S3 bucket
directly, so local development wrote vectors into production storage. Setting
`ENABLE_MILVUS_S3=false` keeps all local ingestion inside a throwaway MinIO
container, isolated from production — the same idea as running a local MongoDB
instead of Atlas.

Embeddings are always computed locally (`sentence-transformers/all-MiniLM-L6-v2`),
so no text leaves the machine regardless of this flag. The flag only controls
where the resulting vectors are persisted.

## How the flag maps to compose

`docker compose` cannot branch on its own, so the flag drives two variables. The
`Makefile` reads `ENABLE_MILVUS_S3` and exports them for you:

| `ENABLE_MILVUS_S3` | `COMPOSE_PROFILES` | `MILVUS_USER_CONFIG` | Milvus talks to        |
|--------------------|--------------------|----------------------|------------------------|
| `false` (default)  | `localstorage`     | `user.local.yaml`    | local `minio` container|
| `true`             | *(empty)*          | `user.yaml`          | AWS S3 (`ap-south-1`)  |

- `COMPOSE_PROFILES=localstorage` starts the `minio` service (it has
  `profiles: ["localstorage"]`, so it only runs in local mode).
- `MILVUS_USER_CONFIG` selects which config file is mounted over Milvus's
  `user.yaml`:
  - `milvus/user.local.yaml` → `address: minio:9000`, `useSSL: false`, bucket
    `milvus-local`.
  - `milvus/user.yaml` → `address: s3.ap-south-1.amazonaws.com`, `useSSL: true`,
    bucket `jarcube-milvus-data`.

Credentials always come from the environment (`AWS_ACCESS_KEY_ID` /
`AWS_SECRET_ACCESS_KEY`), forwarded to Milvus as `MINIO_ACCESS_KEY_ID` /
`MINIO_SECRET_ACCESS_KEY`. In local mode those same values become the MinIO root
user/password and can be anything.

## Usage

With the Makefile (recommended — it sets the variables from `.env`):

```bash
make up            # full stack, storage backend chosen by ENABLE_MILVUS_S3
make up-storage    # just etcd + (minio) + milvus
make health        # show container health
make down          # stop, keep data
make down-hard     # stop and DELETE all vector data
```

Running `docker compose` directly (you must export the two variables yourself):

```bash
# local MinIO
COMPOSE_PROFILES=localstorage MILVUS_USER_CONFIG=user.local.yaml \
  docker compose up -d

# production S3
COMPOSE_PROFILES= MILVUS_USER_CONFIG=user.yaml \
  docker compose up -d
```

## MinIO console

In local mode a MinIO web console is exposed at http://localhost:9001 (login
with `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`, or `minioadmin`/`minioadmin`
if those are unset). Milvus auto-creates the `milvus-local` bucket on first boot.

## Switching backends

Vector data does **not** migrate between backends. Data ingested against local
MinIO lives only in the `minio_data` volume; data in S3 lives in the bucket.
After flipping the flag you start from the other store's contents (re-ingest if
you need the same corpus).

## Notes / gotchas

- **Named volumes, not bind mounts.** MinIO writes `xl.meta` with `O_DIRECT`,
  which Docker Desktop's file-sharing layer rejects on host bind mounts
  (Milvus then crash-loops on flush). The `minio_data` volume is Docker-managed
  for this reason. See `PLAN.md` findings L24 / D6.
- **Production still uses `user.yaml`** with the real bucket, region and SSL —
  those keys have no Milvus environment-variable equivalent, so they must live
  in the mounted file.
