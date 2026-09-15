# Dashboard Hosting Notes (S3 static export vs Vercel)

This dashboard (QuantumMind-ui, Next.js 12) can be hosted two ways. It is
currently configured for **S3 static export**. This file records exactly what
was changed so you can switch to **Vercel** later without guessing.

---

## TL;DR

- **Now:** static export → uploaded to S3 bucket `app.jarcube.com` → served via
  Cloudflare. Cost ~pennies/month.
- **The app has NO server-side rendering** (no `getServerSideProps`, no
  `pages/api`), so both static export and Vercel work.
- To move to Vercel: **revert the 3 config changes below**, keep the route
  refactor, connect the repo, set env vars. That's it.

---

## What was changed for static (S3) hosting

### 1. `next.config.js` — 3 changes (these are S3-SPECIFIC)

| Change | Static (S3) — current | Vercel — use this |
|---|---|---|
| `experimental.outputStandalone` | **removed** | leave removed (Vercel manages its own build) |
| `trailingSlash` | **`true`** (added) | **remove it** (or `false`) — Vercel routes without it |
| `images.unoptimized` | **`true`** (added) | **remove it** — Vercel HAS the image optimizer, let it run |

Why each exists:
- **`outputStandalone`** builds a self-contained Node **server** bundle. That is
  the opposite of static; removed so `next export` can produce plain files.
- **`trailingSlash: true`** makes every route export as `route/index.html`, which
  S3 static-website hosting serves correctly on refresh/deep-link. On Vercel this
  is unnecessary and changes your URLs, so drop it.
- **`images.unoptimized: true`** disables Next's on-the-fly image optimizer,
  which requires a running server S3 does not have. Vercel provides that server,
  so remove this to get optimized images back.

### 2. `package.json`

- Added script: `"build:static": "next build && next export"` → outputs `./out`.
- Keep it (harmless on Vercel; Vercel uses `next build` on its own).

### 3. Route refactor — KEEP THIS on both platforms

Dynamic routes were converted from path params to query params because
`next export` cannot pre-generate unknown dynamic paths at build time:

| Old (path param) | New (query param) |
|---|---|
| `pages/bots/bot-flow/[botId].tsx` | `pages/bots/bot-flow/index.tsx` |
| `pages/bots/settings/[botId].tsx` | `pages/bots/settings/index.tsx` |
| `/bots/bot-flow/<id>` | `/bots/bot-flow?botId=<id>` |
| `/bots/settings/<id>` | `/bots/settings?botId=<id>` |

Links updated in: `pages/bots/list/index.tsx` (3), `pages/bots/settings/index.tsx`
(1), `pages/bots/create/index.tsx` (1). The pages read `router.query.botId`,
which works identically for path and query params — so this refactor is safe to
keep on Vercel. No need to revert.

---

## Env vars (both platforms)

All `NEXT_PUBLIC_*` are inlined at build time. On Vercel, set these in
Project → Settings → Environment Variables (Production):

```
NEXT_PUBLIC_API_URL=https://api.jarcube.com        # origin, NO /api
NEXT_PUBLIC_BACKEND_URL=https://api.jarcube.com/api
NEXT_PUBLIC_SOCKET_URL=https://api.jarcube.com
NEXT_PUBLIC_FILE_URL=https://api.jarcube.com
NEXT_PUBLIC_SCRAPER_URL=https://api.jarcube.com
BACKEND_URL=https://api.jarcube.com
NEXT_PUBLIC_WIDGET_URL=https://templates.jarcube.com/widget/plugin.js
NEXT_PUBLIC_EMAIL=            # blank in production
NEXT_PUBLIC_PASSWORD=         # blank in production
```

---

## How to deploy — S3 (current)

```bash
cd QuantumMind-ui
export NODE_OPTIONS=--max-old-space-size=4096
npm run build:static                     # -> ./out
aws s3 sync out/ s3://app.jarcube.com/ --delete
```
DNS: `app` CNAME -> `app.jarcube.com.s3-website.ap-south-1.amazonaws.com`, Proxied.

---

## How to deploy — Vercel (future)

1. In `next.config.js`, remove `trailingSlash: true` and
   `images: { unoptimized: true }` (see the table above). Keep the route refactor.
2. Push the repo to GitHub/GitLab.
3. Vercel → New Project → import the repo. Framework auto-detects **Next.js**.
   Build command `next build`, output handled by Vercel (no `export` needed).
4. Add the env vars above (Production scope).
5. Add custom domain `app.jarcube.com` in Vercel → Domains, and point the
   Cloudflare DNS record at Vercel (CNAME to `cname.vercel-dns.com`), set that
   record to **DNS only** (grey cloud) so Vercel handles TLS, OR keep it Proxied
   with SSL mode Full.
6. Deploy. Vercel gives HTTPS + CDN automatically.

Note: on Vercel you can also drop the S3 bucket for the dashboard entirely.

---

## Cost comparison

| Option | Monthly cost | Notes |
|---|---|---|
| **S3 + Cloudflare (current)** | ~$0.10-0.50 | S3 storage (16 MB) + requests; Cloudflare free tier does CDN/TLS |
| **Vercel Hobby (free)** | $0 | Personal/non-commercial only; 100 GB bandwidth/mo. NOT allowed for commercial/business use per Vercel terms. |
| **Vercel Pro** | $20/user/mo | Required for commercial use; includes 1 TB bandwidth, then usage-based overages |

**Bottom line:** S3 + Cloudflare is the cheapest and is fine for an MVP. Vercel
Hobby is free but its license disallows commercial use — for a real business
dashboard you'd need **Vercel Pro at ~$20/month**, which is far more than the S3
route. Move to Vercel only if you want its DX (git-push deploys, preview URLs,
built-in image optimization), not to save money.
