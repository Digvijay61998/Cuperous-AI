# JarCube Platform — Infrastructure & Deployment Guide

A complete, human-friendly runbook to set up the whole JarCube platform for an
MVP, from scratch, without needing any AI help. Follow it top to bottom, or jump
to the piece you need.

**What this guide covers:**
- **PART 1 (sections 0-11):** the BACKEND API on AWS EC2 + HTTPS via Cloudflare.
- **PART 2 (sections 12-17):** the whole platform map, then templates + widget
  (S3), the dashboard (S3 static export), the AI service (laptop + Cloudflare
  Tunnel), a full smoke test, and the security TODO list.

> **New here? Read section 12 (Platform map) first** — it shows what runs where
> and how the four pieces connect. Then set up the backend (PART 1), then the
> other pieces in PART 2.

---

## PART 1 — BACKEND (EC2, no Docker / no nginx)

The backend runs directly as a Node process managed by PM2. Templates and
uploads go to S3; the database is MongoDB Atlas; Redis runs locally on the
instance.

This is intentionally lean and low-cost: **no Docker, no nginx, no load
balancer.** The app is reached directly at `http://<ELASTIC_IP>:4000`, then
fronted by Cloudflare for HTTPS at `https://api.jarcube.com`.

---

## 0. Reference values

Fill these in for your environment. The values below are the ones used for the
first deployment.

| Item | Value |
|---|---|
| Region | `ap-south-1` (Mumbai) |
| Instance | `jarcube-backend` (`i-0709abb92da47fa75`) |
| Instance type | `t3.micro` |
| OS | Ubuntu 26.04 LTS |
| Elastic IP | `15.252.211.196` |
| Security group | `couperous-backend-sg` |
| SSH user | `ubuntu` |
| Backend port | `4000` |
| SSH key (local copy) | `~/jarcube-key.pem` |

> Terminal prompts tell you which machine you are on:
> - **Laptop:** `jay@jay-Inspiron-7560:...$`
> - **EC2 server:** `ubuntu@ip-172-31-10-86:~$`

---

## 1. Prerequisites on AWS (one-time, done in the Console)

1. **Launch an EC2 instance**
   - AMI: Ubuntu 22.04/24.04/26.04 LTS, 64-bit (x86)
   - Type: `t3.micro` (MVP) or `t3.small` (more headroom)
   - Storage: 20 GiB gp3 (8 GiB is too tight once node_modules + build exist)
   - File systems: **None** (only the root volume is needed)
   - Key pair: create/download a `.pem` (e.g. `jarcube-key.pem`) — this is your
     private SSH login key. Never commit or share it.

2. **Security group inbound rules** (`couperous-backend-sg`)

   | Type | Protocol | Port | Source |
   |---|---|---|---|
   | SSH | TCP | 22 | My IP (safer) or Anywhere |
   | HTTP | TCP | 80 | Anywhere |
   | HTTPS | TCP | 443 | Anywhere |
   | Custom TCP | TCP | 4000 | Anywhere (so the widget/frontend can reach the API) |

3. **Allocate an Elastic IP** and associate it with the instance
   - EC2 → Network & Security → **Elastic IPs** → Allocate → Associate → select
     the instance.
   - Why: the auto-assigned public IP changes on every stop/start. The Elastic
     IP is fixed, so DNS and the Atlas allowlist stay valid.

4. **MongoDB Atlas network access**
   - Atlas → Network Access → Add IP Address → add the **Elastic IP**
     (`15.252.211.196`). Without this the backend cannot reach the database.

---

## 2. Connect to the instance from your laptop

The `.pem` key must have strict permissions (owner read-only) or SSH refuses it.

> **Gotcha:** if the key lives on an external NTFS/exFAT drive, `chmod` is
> ignored there (the filesystem cannot store Linux permissions) and you get
> `Permissions 0777 ... too open`. Copy the key to your home directory first.

```bash
# On the LAPTOP
cp /path/to/jarcube-key.pem ~/jarcube-key.pem
chmod 400 ~/jarcube-key.pem

ssh -i ~/jarcube-key.pem ubuntu@15.252.211.196
```

First connection asks to confirm the host fingerprint — type `yes`.
Success looks like the prompt changing to `ubuntu@ip-172-31-10-86:~$`.

---

## 3. Provision the server (one-time, ON the EC2 box)

Run everything in this section on the server (`ubuntu@ip-...` prompt).

### 3.1 Install Node 20, Redis, Git, PM2

> Use Node **20**, not 18. The `@whiskeysockets/baileys` dependency (WhatsApp
> Web engine) hard-requires Node 20+ and its install script fails on 18 with
> `This package requires Node.js 20+ to run reliably`.

```bash
sudo apt update

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Redis + Git
sudo apt install -y redis-server git

# PM2 (process manager: keeps the app alive, restarts on crash/reboot)
sudo npm install -g pm2

# Verify
node -v        # expect v20.x
npm -v
redis-cli --version
pm2 -v
```

### 3.2 Configure Redis with a password

The backend's session store connects to Redis at boot, so Redis must be running
with the password from `.env` (`redispass`).

```bash
sudo sed -i 's/^# requirepass foobared/requirepass redispass/' /etc/redis/redis.conf
sudo systemctl restart redis-server
sudo systemctl enable redis-server
redis-cli -a redispass ping     # expect PONG
```

### 3.3 Add swap (required on t3.micro)

`t3.micro` has 1 GB RAM; `nest build` needs more than that and dies with
`JavaScript heap out of memory`. Use a **3 GB** swap file for the build.

```bash
sudo fallocate -l 3G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h        # confirm Swap shows 3.0Gi
```

> If you already created a 1 GB swap, resize it:
> ```bash
> sudo swapoff /swapfile
> sudo fallocate -l 3G /swapfile
> sudo chmod 600 /swapfile
> sudo mkswap /swapfile
> sudo swapon /swapfile
> ```

Also raise Node's heap limit for the build (swap alone is not enough — Node
caps its own heap):

```bash
export NODE_OPTIONS=--max-old-space-size=2048
```

---

## 4. Ship the code to the server (rsync from laptop)

We copy the code with `rsync` — no git remote needed. Run this in a terminal
**on the laptop** (prompt `jay@...`), NOT on the server.

`node_modules`, `dist`, `.git`, and `.env` are excluded on purpose:
- deps are installed fresh on the server (native modules must match the OS),
- `.env` is created on the server so local dev secrets never ship.

```bash
# On the LAPTOP, from the backend project directory
cd /media/jay/427EF9697EF9565F1/Digvijay-projects/Cuperous-AI/QuantumMind-backend

rsync -avz -e "ssh -i ~/jarcube-key.pem" \
  --exclude node_modules \
  --exclude dist \
  --exclude .git \
  --exclude .env \
  ./ ubuntu@15.252.211.196:/home/ubuntu/backend/
```

Re-run this same command any time you want to push code changes.

---

## 5. Create the production `.env` (ON the server)

Back on the server. The production env differs from local in three ways:
- `SERVER_DOMAIN` points at the Elastic IP (not localhost),
- strong `SESSION_SECRET` / `JWT_SECRET` (the code falls back to weak defaults
  otherwise),
- `MONGO_URI` is the Atlas cluster.

Generate two strong secrets first:

```bash
openssl rand -hex 32   # copy output -> SESSION_SECRET
openssl rand -hex 32   # copy output -> JWT_SECRET
```

Then create the file:

```bash
cd /home/ubuntu/backend
nano .env
```

Paste and edit:

```
PORT=4000
SERVER_DOMAIN=http://15.252.211.196:4000

MONGO_URI=<your Atlas connection string>

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=redispass

AWS_ENABLED=true
AWS_ACCESS_KEY_ID=<your key>
AWS_SECRET_ACCESS_KEY=<your secret>
AWS_REGION=ap-south-1
AWS_S3_BUCKET=jarcube-template-hosting

FILE_STORAGE=s3
TEMPLATE_STORAGE=s3
TEMPLATE_PUBLIC_BASE_URL=https://templates.jarcube.com

SESSION_SECRET=<paste openssl output #1>
JWT_SECRET=<paste openssl output #2>
JWT_EXPIRES_IN=30000m

AI_URL=http://127.0.0.1:8000
```

Save in nano: `Ctrl+O`, `Enter`, then `Ctrl+X`.

---

## 6. Install, build, and run (ON the server)

```bash
cd /home/ubuntu/backend
rm -rf node_modules package-lock.json   # clean install (avoids stale lock)
npm install
npm run build            # compiles TypeScript -> dist/

# Start under PM2 using the production entrypoint
pm2 start dist/main.js --name jarcube-backend

# Persist the process list and enable auto-start on reboot
pm2 save
pm2 startup              # run the exact sudo command it prints, then:
pm2 save
```

Verify it is listening:

```bash
curl -I http://localhost:4000/api/docs   # expect HTTP/1.1 200
```

---

## 7. Verify from the outside

From the laptop (or a browser):

```bash
curl -I http://15.252.211.196:4000/api/docs
```

- Swagger UI: `http://15.252.211.196:4000/api/docs`
- If it times out: check the security group has port 4000 open.
- If Mongo errors in logs: confirm the Elastic IP is in the Atlas allowlist.

---

## 8. Everyday operations (ON the server)

```bash
pm2 status                     # process state
pm2 logs jarcube-backend       # live logs
pm2 restart jarcube-backend    # restart after config change
pm2 stop jarcube-backend
pm2 delete jarcube-backend
```

### Redeploy after code changes

```bash
# 1) LAPTOP: push code
rsync -avz -e "ssh -i ~/jarcube-key.pem" \
  --exclude node_modules --exclude dist --exclude .git --exclude .env \
  ./ ubuntu@15.252.211.196:/home/ubuntu/backend/

# 2) SERVER: rebuild + reload
cd /home/ubuntu/backend
npm install          # only needed if dependencies changed
npm run build
pm2 reload jarcube-backend
```

---

## 9. Known limitations (MVP trade-offs)

- **HTTP only.** The backend is served over plain `http://<IP>:4000`. A browser
  page loaded over `https` cannot call an `http` backend (mixed content). To
  call it from an https site later, put it behind a domain with TLS
  (nginx + Cloudflare, or a load balancer).
- **AWS keys live in `.env`** on the box. The upload code requires explicit
  keys and does not use an EC2 instance role as-is. Rotate the keys if they
  are ever exposed.
- **Single instance, local Redis.** Fine for low traffic; not horizontally
  scalable without moving Redis/sessions to a shared service.
- **Generic `/api/file` uploads** need the IAM policy to allow the relevant S3
  prefixes (`docs/*` etc.) and a serving strategy; templates work already.

---

## 10. Troubleshooting quick reference

| Symptom | Likely cause | Fix |
|---|---|---|
| `Permissions 0777 ... too open` | key on NTFS/exFAT drive | copy key to `~`, `chmod 400` |
| `Permission denied (publickey)` | wrong key/user, or ran ssh while already on server | use `ubuntu@<IP>` with `~/jarcube-key.pem` from the laptop |
| `Could not resolve hostname elastic_ip` | placeholder not replaced | use the real IP |
| App exits on start | Redis not reachable / no `.env` | check `redis-cli -a redispass ping`, verify `.env` |
| DB connection timeout | Elastic IP not in Atlas allowlist | add it in Atlas Network Access |
| Port 4000 unreachable externally | SG rule missing | add Custom TCP 4000 inbound |
| Build killed / OOM | t3.micro out of RAM | add swap (section 3.3) |
| `521` via Cloudflare | CF Flexible connects to origin :80, nothing listens there | redirect :80 -> :4000 (section 11) |
| `403` + `x-amz-*` on api.jarcube.com | a broad Worker route (`*.jarcube.com/*`) forwards to S3 | narrow the Worker route to `templates.jarcube.com/*` |

---

## 11. Put the backend behind HTTPS via Cloudflare (api.jarcube.com)

Needed once any HTTPS site (the UI dashboard, or a widget on an https page)
must call the backend — an https page cannot call `http://<IP>:4000`
(mixed content). This keeps the lean setup: no nginx, no server TLS.

### 11.1 Cloudflare DNS

- DNS → Add record: **A**, name `api`, IPv4 = Elastic IP (`15.252.211.196`),
  Proxy status **Proxied** (orange cloud).

### 11.2 Narrow any existing Worker route

If a Worker route like `*.jarcube.com/*` exists, it will hijack `api.jarcube.com`
and forward it to S3 (symptom: `403` with `x-amz-error-code: AccessDenied`).
Scope the Worker route to exactly `templates.jarcube.com/*`.

### 11.3 SSL/TLS mode

- SSL/TLS → Overview → **Flexible**.
- Flexible = browser↔Cloudflare is HTTPS; Cloudflare↔origin is HTTP on **port 80**.
- Trade-off: the Cloudflare↔EC2 hop is unencrypted (cookies/JWTs travel on it).
  Acceptable for MVP; harden to **Full (strict)** later with a Cloudflare Origin
  Certificate + a TLS listener on the box.

### 11.4 Make the app reachable on port 80 (Cloudflare Flexible connects there)

The app listens on 4000, so redirect 80 → 4000 with iptables (reboot-safe):

```bash
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 4000
sudo iptables -t nat -A OUTPUT -p tcp -o lo --dport 80 -j REDIRECT --to-port 4000
sudo apt install -y iptables-persistent   # choose "Yes" to save current rules
sudo netfilter-persistent save
curl -I http://localhost:80/api/docs       # expect 200 (NestJS headers)
```

### 11.5 Point the backend config at the domain

```bash
cd /home/ubuntu/backend
nano .env      # set: SERVER_DOMAIN=https://api.jarcube.com
pm2 restart jarcube-backend
```

### 11.6 Verify

```bash
curl -I https://api.jarcube.com/api/docs   # expect HTTP/2 200 + NestJS headers
```

If you see `x-amz-*` headers → a Worker route is still hijacking it (11.2).
If you see `521` → nothing on origin :80 (11.4) or SG blocks 80.

---

---

# ==========================================================================
# PART 2 — WHOLE PLATFORM GUIDE
# ==========================================================================
#
# Sections 0-11 above cover the BACKEND only. The rest of this file covers
# every other piece we deployed, so one document sets up the whole system.
#
# Read section 12 first for the map, then jump to the piece you need.

---

## 12. Platform map (what runs where)

Four pieces, four homes. Everything ties together through the `jarcube.com`
domain on Cloudflare (free DNS + HTTPS + CDN).

| Piece | Lives on | Public URL | Cost |
|---|---|---|---|
| **Backend API** (NestJS) | EC2 `t3.micro` + PM2 | `https://api.jarcube.com` | ~free (AWS free tier) |
| **Templates + Widget** (static files) | S3 bucket `jarcube-template-hosting` | `https://templates.jarcube.com` | pennies |
| **Dashboard** (Next.js static export) | S3 bucket `app.jarcube.com` | `https://app.jarcube.com` | pennies |
| **AI service** (FastAPI + Milvus) | your LAPTOP (Docker) via Cloudflare Tunnel | `https://ai.jarcube.com` | OpenAI usage only |
| Database | MongoDB Atlas (free tier) | — | free |

```
                 Cloudflare (DNS + HTTPS + CDN)
   ┌───────────────────┬───────────────────┬───────────────────┐
   │                   │                   │                   │
 api.jarcube.com   templates.jarcube.com  app.jarcube.com   ai.jarcube.com
   │ (proxied A)      │ (Worker->S3)       │ (S3, same-name)   │ (Cloudflare Tunnel)
   ▼                   ▼                   ▼                   ▼
 EC2 t3.micro       S3 bucket           S3 bucket           LAPTOP (Docker)
 backend :4000      jarcube-template-   app.jarcube.com     FastAPI :8000
 + Redis            hosting                                 + Milvus + etcd
   │                                                          │
   ▼                                                          ▼
 MongoDB Atlas                                          S3 jarcube-milvus-data
                                                          + OpenAI API
```

**Key idea that trips people up:** an S3 *website* endpoint picks the bucket
from the incoming `Host` header. So for a custom domain to work through
Cloudflare you must EITHER name the bucket exactly like the domain (what we did
for `app.jarcube.com`) OR run a tiny Cloudflare Worker that rewrites the Host
header (what we did for `templates.jarcube.com`).

---

## 13. Templates + Widget hosting (S3 `jarcube-template-hosting`)

Static files: hosted website templates AND the embeddable chat widget
(`plugin.js`). Bucket name does NOT match the domain, so a Cloudflare Worker
rewrites the Host header.

### 13.1 Bucket setup (AWS Console, admin login)

- Bucket `jarcube-template-hosting`, region `ap-south-1`.
- Block Public Access: **OFF**.
- Properties → Static website hosting: **Enable**, index `index.html`,
  error `index.html`.
- Permissions → Bucket policy (public read on the two served prefixes only):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadTemplates",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::jarcube-template-hosting/templates/*"
        },
        {
            "Sid": "PublicReadWidget",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::jarcube-template-hosting/widget/*"
        }
    ]
}
```

### 13.2 IAM policy for the backend user (`jarcube-backend`)

The backend writes templates (and, if enabled, general uploads) to S3. Attach
this to the IAM user whose keys are in the backend `.env`:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "ListTemplateBucket",
            "Effect": "Allow",
            "Action": "s3:ListBucket",
            "Resource": "arn:aws:s3:::jarcube-template-hosting"
        },
        {
            "Sid": "ManageObjects",
            "Effect": "Allow",
            "Action": ["s3:GetObject","s3:PutObject","s3:DeleteObject","s3:AbortMultipartUpload"],
            "Resource": [
                "arn:aws:s3:::jarcube-template-hosting/templates/*",
                "arn:aws:s3:::jarcube-template-hosting/widget/*",
                "arn:aws:s3:::jarcube-template-hosting/docs/*",
                "arn:aws:s3:::jarcube-template-hosting/template-submissions/*"
            ]
        }
    ]
}
```

### 13.3 Cloudflare Worker (Host-header rewrite + CORS)

Workers & Pages → Create Worker (named e.g. `calm-sunset-bdcb`) → paste:

```javascript
export default {
  async fetch(request) {
    const url = new URL(request.url);

    // CORS preflight (S3 returns 403 for OPTIONS) — needed for widget import.
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      }});
    }

    url.hostname = 'jarcube-template-hosting.s3-website.ap-south-1.amazonaws.com';
    url.protocol = 'http:';

    const response = await fetch(new Request(url, {
      method: request.method, headers: request.headers, body: request.body,
    }));

    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Expose-Headers', '*');
    return new Response(response.body, {
      status: response.status, statusText: response.statusText, headers,
    });
  },
};
```

Then Settings → Domains & Routes → Add route: `templates.jarcube.com/*`,
zone `jarcube.com`.

> IMPORTANT: keep this route scoped to `templates.jarcube.com/*`. A broad
> `*.jarcube.com/*` route hijacks `api.` and `app.` and breaks them.

DNS: `templates` CNAME → `jarcube-template-hosting.s3-website.ap-south-1.amazonaws.com`, Proxied.

### 13.4 Upload the widget bundle (one-time, from LAPTOP)

`Content-Type` matters — browsers refuse to execute a module served as
`binary/octet-stream`.

```bash
aws s3 cp uploaded-docs/plugin.js \
  s3://jarcube-template-hosting/widget/plugin.js \
  --content-type "application/javascript" \
  --cache-control "public, max-age=31536000, immutable"
```

Verify: `curl -I https://templates.jarcube.com/widget/plugin.js` → 200,
`content-type: application/javascript`.

Templates upload automatically from the backend (POST /api/template).

---

## 14. Dashboard (Next.js static export, S3 `app.jarcube.com`)

The dashboard is a client-side React/Next app with NO server-side rendering, so
it exports to static files and hosts on S3 for pennies. The bucket is named
EXACTLY `app.jarcube.com` so no Worker is needed (S3 finds the bucket by the
Host header).

### 14.1 Code prep (already done in the repo — for reference)

- Dynamic routes `[botId]` were converted to query params
  (`/bots/bot-flow?botId=x`) because `next export` cannot pre-generate unknown
  dynamic paths.
- `next.config.js`: removed `outputStandalone`, added `trailingSlash: true` and
  `images.unoptimized: true`.
- `.env` uses HTTPS backend URLs (all `NEXT_PUBLIC_*` are baked in at build).

### 14.2 Build the static site (on LAPTOP)

```bash
cd .../QuantumMind-ui
# .env must point at production backend:
#   NEXT_PUBLIC_API_URL=https://api.jarcube.com   (origin, NO /api)
#   NEXT_PUBLIC_BACKEND_URL=https://api.jarcube.com/api
#   NEXT_PUBLIC_SOCKET_URL / FILE_URL = https://api.jarcube.com
#   NEXT_PUBLIC_WIDGET_URL=https://templates.jarcube.com/widget/plugin.js
#   NEXT_PUBLIC_EMAIL= / NEXT_PUBLIC_PASSWORD=  (blank in prod)
export NODE_OPTIONS=--max-old-space-size=4096
npm run build:static      # = next build && next export -> ./out
```

### 14.3 S3 bucket (AWS Console, admin login)

- Create bucket named EXACTLY **`app.jarcube.com`**, region `ap-south-1`.
- Block Public Access: **OFF**.
- Properties → Static website hosting: **Enable**, index `index.html`,
  error `404.html`.
- Permissions → Bucket policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadDashboard",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::app.jarcube.com/*"
        }
    ]
}
```

### 14.4 Upload (from LAPTOP)

```bash
cd .../QuantumMind-ui
aws s3 sync out/ s3://app.jarcube.com/ --delete
```

### 14.5 Cloudflare DNS

- DNS → Add record: **CNAME**, name `app`, target
  `app.jarcube.com.s3-website.ap-south-1.amazonaws.com` (hostname only, NO
  `http://`), Proxy status **Proxied**.

Verify: `curl -I https://app.jarcube.com/` → 200.

### 14.6 Redeploy after code changes

```bash
cd .../QuantumMind-ui
export NODE_OPTIONS=--max-old-space-size=4096
npm run build:static
aws s3 sync out/ s3://app.jarcube.com/ --delete
```

---

## 15. AI service (laptop via Cloudflare Tunnel, `ai.jarcube.com`)

The AI service (FastAPI RAG + Milvus vector DB) runs on YOUR LAPTOP in Docker.
A Cloudflare Tunnel exposes it at `https://ai.jarcube.com` so the EC2 backend
can reach it. Milvus stores vectors in S3 bucket `jarcube-milvus-data`.

> **Uptime trade-off:** the AI is only up while your laptop is on with Docker +
> cloudflared running. Both auto-start, so a reboot recovers — but sleep/shutdown
> takes AI offline. Fine for MVP; move to an always-on box for real traffic.

### 15.1 AI service `.env` (in QuantumMind-ai/.env) — production values

```
APP_ENV=production
AI_DEBUG_LOGS=false
ENABLE_MILVUS_S3=true          # persist vectors to S3, not local MinIO
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
OPENAI_API_KEY=<your key>      # REQUIRED — no key, no answers
AWS_ACCESS_KEY_ID=<key with access to jarcube-milvus-data>
AWS_SECRET_ACCESS_KEY=<secret>
AWS_REGION=ap-south-1
```

The S3 bucket/region/SSL for Milvus live in `milvus/user.yaml`
(bucket `jarcube-milvus-data`). Do not change `rootPath` on a running instance.

### 15.2 Start the AI stack (on LAPTOP, needs Docker)

```bash
cd .../QuantumMind-ai
make up            # starts etcd + milvus + ai-service (S3 mode from .env)
docker compose ps  # all should be healthy
curl -s localhost:8000/healthcheck   # expect {"status":...}
```

### 15.3 Install cloudflared (one-time)

```bash
cd /tmp
curl -L -o cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
cloudflared --version
```

### 15.4 Create and route the tunnel (one-time)

```bash
cloudflared tunnel login                         # browser: authorize jarcube.com
cloudflared tunnel create jarcube-ai             # note the TUNNEL-ID printed
cloudflared tunnel route dns jarcube-ai ai.jarcube.com
```

Config file `~/.cloudflared/config.yml`:

```yaml
tunnel: <TUNNEL-ID>
credentials-file: /home/jay/.cloudflared/<TUNNEL-ID>.json

ingress:
  - hostname: ai.jarcube.com
    service: http://localhost:8000
  - service: http_status:404
```

### 15.5 Run as a background service (survives reboot)

The systemd service runs as root, so the config must live in `/etc/cloudflared`:

```bash
sudo mkdir -p /etc/cloudflared
sudo cp ~/.cloudflared/config.yml /etc/cloudflared/config.yml
sudo cp ~/.cloudflared/<TUNNEL-ID>.json /etc/cloudflared/
sudo sed -i 's#/home/jay/.cloudflared#/etc/cloudflared#' /etc/cloudflared/config.yml

sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared     # expect active (running)
```

Verify: `curl -s -o /dev/null -w "%{http_code}\n" https://ai.jarcube.com/healthcheck` → 200.

### 15.6 Point the backend at the AI service (on EC2)

```bash
cd /home/ubuntu/backend
nano .env      # set: AI_URL=https://ai.jarcube.com
pm2 restart jarcube-backend
```

### 15.7 End-to-end test (from anywhere, until the WAF lock is on)

```bash
# ingest a fact
curl -s -X POST https://ai.jarcube.com/ingest/text -H "Content-Type: application/json" \
  -d '{"client_id":"e2e","text":"Support hours are Mon-Fri 9-6 IST.","source":"doc","source_type":"manual"}'
# ask about it (routes to /query/ask, field is "question")
curl -s -X POST https://ai.jarcube.com/query/ask -H "Content-Type: application/json" \
  -d '{"client_id":"e2e","question":"What are your support hours?"}'
# cleanup
curl -s -X DELETE "https://ai.jarcube.com/ingest/e2e/doc"
```

### 15.8 Lock it down (protect your OpenAI key) — Cloudflare WAF

`ai.jarcube.com` is public with no auth; anyone can spend your OpenAI tokens.
Restrict it to the backend IP. Zone-level custom rules are FREE (the
account-level WAF add-on is NOT needed).

- Inside the `jarcube.com` domain → **Security → Security rules** → Create rule
  → Custom rule.
- Expression: `(http.host eq "ai.jarcube.com" and ip.src ne 15.252.211.196)`
- Action: **Block** → Deploy.

After this, only the backend (Elastic IP) can reach the AI. Test from any other
machine → expect **403**.

### 15.9 AI daily operations (on LAPTOP)

```bash
cd .../QuantumMind-ai
make health                       # container health
docker logs -f quantummind-ai     # AI logs
make down                         # stop stack (keep vectors)
make up                           # start stack
sudo systemctl status cloudflared # tunnel status
```

---

## 16. Full-platform smoke test (after everything is up)

```bash
curl -I https://api.jarcube.com/api/docs            # backend  -> 200
curl -I https://templates.jarcube.com/widget/plugin.js  # widget -> 200 (js)
curl -I https://app.jarcube.com/                    # dashboard -> 200
curl -s -o /dev/null -w "%{http_code}\n" https://ai.jarcube.com/healthcheck  # AI (from backend IP) -> 200
```

Then open `https://app.jarcube.com`, log in, open a bot, trigger an AI node,
and confirm a grounded answer comes back.

---

## 17. Security TODO (before real customer traffic)

These were accepted as MVP trade-offs and should be revisited:

- **Rotate all exposed credentials.** AWS keys, Atlas DB password, and the
  OpenAI key have appeared in setup steps/chat. Rotate them and update the
  `.env` files, then restart the affected services.
- **Backend TLS hop.** Cloudflare SSL mode is **Flexible** — the Cloudflare↔EC2
  hop is unencrypted. Harden to **Full (strict)** with a Cloudflare Origin
  Certificate on the box.
- **AI WAF lock** (section 15.8) — do this if not already.
- **AI on an always-on host** — move off the laptop when uptime matters.
- **Generic `/api/file` uploads** are unauthenticated (`@Public()`) and share the
  template bucket; consider a separate private bucket + presigned GETs.

---

<!-- cmd to create backend .env secrets:
openssl rand -hex 32   -> SESSION_SECRET
openssl rand -hex 32   -> JWT_SECRET -->
