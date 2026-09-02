# Executive Summary

> **Source of truth:** `package.json`, `README.md`, `LICENSE`, `src/app.module.ts`, `openapi.json`
> **Band:** Orientation · **Depends on:** none · **Jarcube class:** MIXED

## Purpose

What OpenWA is, what it is built from, how big it is, and what its legal and operational posture is.
Read this before anything else in the set. Everything downstream assumes the vocabulary and the
constraints established here.

## What it is

OpenWA is a self-hosted **WhatsApp API gateway**. It turns one or more linked WhatsApp accounts into
an HTTP + WebSocket API, with a bundled React dashboard, webhook fan-out, a plugin system, and an
MCP server for agent access.

It is **not** a Meta Cloud API client. It drives reverse-engineered WhatsApp clients — whatsapp-web.js
(headless Chromium against WhatsApp Web) and Baileys (the multi-device WebSocket protocol, spoken
directly). That single fact shapes most of the architecture, and it is the main axis along which its
features port to Jarcube or do not. See 98-jarcube-porting-analysis.md.

| | |
| --- | --- |
| Package | `openwa` 0.23.3 |
| Licence | MIT (`LICENSE`) |
| Runtime | Node `>=22.13` (`.nvmrc`) |
| Language | TypeScript `~6.0.3` |
| Framework | NestJS 11 (`@nestjs/core ^11.2.1`) |
| HTTP | Express 5 via `@nestjs/platform-express` |
| Default port | `2785` (`src/main.ts`) |
| API prefix | `/api` (`src/config/app-validation.ts:applyGlobalValidation`) |

## Stack

| Concern | Choice | Notes |
| --- | --- | --- |
| WhatsApp engine A | `whatsapp-web.js` 1.34.7 | Pinned exact. Headless Chromium. Default engine. |
| WhatsApp engine B | `@whiskeysockets/baileys` 7.0.0-rc14 | Pinned exact, release candidate. |
| ORM | `typeorm ^1.1.0` | Two independent connections, `main` and `data`. |
| SQLite driver | `better-sqlite3 ^13.0.3` | Default database. |
| Postgres driver | `pg ^8.23.0` | Optional, selected by `DATABASE_TYPE`. |
| Cache / pub-sub | `ioredis ^6.0.0` | Optional, off by default. |
| Queue | `bullmq ^6.3.1` + `@nestjs/bullmq` | Optional, requires Redis. |
| Queue UI | `@bull-board/nestjs ^9.5.0` | Mounted at `/api/admin/queues`, separately authed. |
| WebSocket | `socket.io ^4.8.3` + `@socket.io/redis-adapter` | Redis adapter enables cross-replica fan-out. |
| Object storage | `@aws-sdk/client-s3 ^3.1120.0` | S3 / MinIO backend for backup + media. |
| Validation | `class-validator ^0.15.1`, `zod ^4.4.3` | class-validator for DTOs, zod for plugin manifests and tools. |
| API docs | `@nestjs/swagger ^11.4.7` | Snapshot committed to `openapi.json`. |
| Security headers | `helmet ^8.3.0` | Configured in `src/configure-app.ts`. |
| Rate limiting | `@nestjs/throttler ^6.5.0` | Three named tiers plus ingress-specific limits. |
| Agent protocol | `@modelcontextprotocol/sdk ^1.30.0` | Opt-in MCP server. |
| Media | `sharp ^0.35.4`, `audio-decode ^2.2.3`, ffmpeg (external binary) | Conversion is opt-in. |
| Docker control | `dockerode ^5.0.1` | The app can manage its own sibling containers. |
| Archives | `archiver ^8.0.0`, `adm-zip ^0.6.0`, `tar-stream ^3.2.0` | Backup/export and plugin install. |
| HTTP client | `undici ^8.10.0` | Webhook delivery, remote media, plugin download. |
| Proxies | `https-proxy-agent`, `socks-proxy-agent` | Per-session proxy support. |

Notable absences: no authentication framework (API keys are hand-rolled), no `joi` (env validation is
hand-rolled in `src/config/env.validation.ts`), no ORM migrations generator beyond TypeORM's own.

## Scale

Measured at commit `33f98b4ca5a56b02603d003aa77280f25e45222e`. Line counts drift; treat as magnitude.

| Area | Files (`.ts`) | Lines |
| --- | --- | --- |
| `src/engine` | 120 | 39,005 |
| `dashboard/src` | 95 | 21,255 |
| `src/modules/session` | 57 | 17,641 |
| `src/core` | 92 | 15,798 |
| `src/modules/message` | 34 | 10,899 |
| `src/common` | 108 | 9,476 |
| `src/modules/infra` | 23 | 8,386 |
| `src/modules/integration` | 45 | 7,438 |
| `src/config` | 32 | 6,247 |
| `src/modules/webhook` | 33 | 6,234 |
| `src/database` | 69 | 5,181 |
| `sdk` | 5 languages | ~371 files |
| remaining 24 modules | ~180 | ~19,000 |

Surface totals:

| Thing | Count |
| --- | --- |
| Feature modules under `src/modules` | 31 |
| Controllers | 33 |
| TypeORM entities | 17 |
| Migrations (`data` connection) | 31 |
| Migrations (`main` connection) | 1 |
| API paths / operations / schemas | 157 / 196 / 219 |
| OpenAPI tags | 24 |
| Canonical event names | 28 |
| Environment identifiers | ~181 |
| Engine adapters behind one interface | 2 |
| e2e spec files | 41 |
| Client SDKs | 5 (Go, Java, JavaScript, PHP, Python) |
| Dashboard locales | 14 |

## Architectural shape in one paragraph

A NestJS monolith with a **pluggable engine layer**. Every WhatsApp capability is declared once on
`IWhatsAppEngine` (`src/engine/interfaces/whatsapp-engine.interface.ts`, 1,423 lines) and implemented
twice — once per adapter. A capability matrix (`src/engine/engine-capability-matrix.ts`) records which
adapter supports what, and unsupported calls return `501` rather than failing obscurely. Sessions are
the central aggregate: each is a linked WhatsApp account with a lifecycle, an owning node, and an
engine instance. Inbound engine events are normalised to 28 canonical events and fanned out to
webhooks (with an outbox for at-least-once delivery), WebSocket subscribers, automation rules, and
sandboxed plugins. Persistence is split across two TypeORM connections: `main` (SQLite, always — API
keys and audit) and `data` (SQLite or Postgres — everything else).

## Operational posture

This is the part most readers underestimate, and it is load-bearing for any port decision.

**Ban risk is inherent and acknowledged.** `README.md` carries an explicit pre-connection warning: the
gateway uses unofficial clients, WhatsApp actively fingerprints such automation, and account
restriction is always possible. The project's guidance is to use a dedicated, disposable number.

**The two engines trade differently**, per the README's own table:

| Engine | Ban-risk profile | Memory per session |
| --- | --- | --- |
| `whatsapp-web.js` | Lower — drives real Chromium, so traffic resembles genuine WhatsApp Web | ~300–500 MB |
| `baileys` | Higher — speaks the multi-device protocol directly, easier to fingerprint | ~30–80 MB |

**The codebase actively manages that risk**, which is why several subsystems exist that a naive
gateway would not have: send pacing with a warm-up schedule and a circuit breaker
(30-message-send-pipeline.md), a typing simulator, a session-restriction store that records when
WhatsApp pushes back (22-session-reconnect-and-liveness.md), and per-session proxy support.

**Upstream fragility is managed by patching.** Nine scripts under `scripts/` monkey-patch
whatsapp-web.js and Baileys at install time, and `scripts/upstream-surface.snapshot.json` plus
`scripts/check-upstream-surface.mjs` detect when upstream moves the ground under those patches. See
18-upstream-patching.md. This is the most fragile part of the system and the least portable.

## What a Jarcube reader should take from this

Three things:

1. **The split is not "OpenWA vs Jarcube", it is "transport vs everything else".** Roughly two-thirds
   of the line count — webhooks, plugins, auth, search, queue, storage, dashboard, integration
   fabric — has nothing to do with how messages reach WhatsApp and ports cleanly.
2. **The engine layer is the largest single area (39k lines) and the least portable.** Jarcube speaks
   the Cloud API, which has no sessions, no QR, no Chromium, and no ban-risk pacing in the same sense.
   Porting it means adopting the unofficial-client posture wholesale, including the ban risk.
3. **The quality machinery is worth stealing on its own.** Doc-parity specs, an engine parity spec, an
   audit coverage spec, a route-fence coverage spec, and five SDK anti-drift scripts all fail CI when
   code and contract diverge. See 96-testing-strategy.md and 97-ci-cd-and-release-gates.md.

## File Inventory

Orientation only; the real inventories live in the band docs.

| Path | Lines | Role |
| --- | --- | --- |
| `package.json` | — | Dependency pins, 60+ npm scripts, engine constraint |
| `README.md` | — | Feature overview and the ban-risk warning |
| `LICENSE` | — | MIT |
| `src/main.ts` | 232 | Process entry point |
| `src/app.module.ts` | 328 | Root module, both data sources, conditional module wiring |
| `openapi.json` | — | Committed API snapshot, CI-verified against the live document |
| `docs/` | 27,883 | OpenWA's own 31-document user/contributor set |

## Jarcube Portability

**Classification:** MIXED

**Rationale:** This doc is orientation, not a subsystem. The portability verdict per area is in
98-jarcube-porting-analysis.md; the summary is that platform services port and the engine layer does
not.

**Prerequisites:** none

**Cloud API caveats:** Jarcube's existing WhatsApp path
(`QuantumMind-backend/src/whatsapp/whatsapp.service.ts`) is Cloud API. Nothing in the engine band
applies to it without adopting an unofficial transport.

## Open Questions

- The README claims the plugin ecosystem lives at an external `OpenWA-plugins` repository. That
  repository is not present in this workspace, so plugin *catalog* content is undocumented here —
  only the loading and sandboxing mechanism is (57-plugin-system.md, 58-plugin-sandbox.md).
- `typeorm ^1.1.0` is an unusual major for TypeORM (0.3.x is current upstream). Not investigated
  whether this is a fork, a re-tagged release, or a private registry artifact.
