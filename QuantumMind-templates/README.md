# QuantumMind Templates

Monorepo of interactive templates served inside WhatsApp WebView (and other
platforms) when a customer interacts with a QuantumMind bot.

Each template is an independent React + Vite app that builds to a self-contained
static bundle. The QuantumMind backend ingests the build as a ZIP, hosts it
(locally in `uploaded-docs/templates/` or on S3), and serves it to customers.

## Structure

```
packages/template-sdk    Shared SDK: URL context, API client, config, theme, actions
templates/*              One folder per template app
tooling/                 Shared vite config, build+zip, upload, scaffolding
releases/                Generated .zip bundles (gitignored)
```

## Prerequisites

- Node >= 18
- pnpm >= 9  (`npm i -g pnpm`)

## Setup

```bash
pnpm install
cp .env.example .env      # set VITE_API_BASE_URL
```

## Common commands

```bash
# Run a template dev server (hot reload)
pnpm --filter doctor-appointment dev

# Build every template (Turborepo only rebuilds what changed)
pnpm build

# Build a single template and produce releases/<slug>.zip
pnpm build:template doctor-appointment

# Scaffold a brand new template
pnpm new:template

# (optional) build + upload a template ZIP straight to the admin API
pnpm upload:template doctor-appointment
```

## The build contract

Every template MUST be hostable from a sub-path, so:

- `vite.config.ts` sets `base: './'` (already wired via the shared config)
- The ZIP contains `index.html` at its root plus an `assets/` folder
- A `manifest.json` declares the editable config (labels, images, colors) the
  admin can override from the dashboard

## Passing context to a template

The bot opens the template with query params the SDK reads automatically:

```
https://<host>/api/file/templates/<id>/v<version>/index.html
  ?vid=<visitorId>&ph=<phone>&bid=<botId>&cid=<conversationId>&src=whatsapp&tid=<templateId>
```

Use `getContext()` from `@quantum/template-sdk` to read them.
