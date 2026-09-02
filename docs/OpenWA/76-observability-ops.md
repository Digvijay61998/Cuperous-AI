# Observability and Operations

> **Source of truth:** `src/common/services/logger.service.ts`, `src/common/services/logger.module.ts`, `src/common/services/request-context.ts`, `src/common/middleware/request-context.middleware.ts`, `src/common/middleware/request-metrics.middleware.ts`, `src/common/interceptors/request-metrics.interceptor.ts`, `scripts/backup.sh`, `scripts/restore.sh`, `scripts/lib-env.sh`, `scripts/smoke-test-*.sh`
> **Band:** Data and infrastructure · **Depends on:** 05-configuration-and-env.md, 04-bootstrap-and-lifecycle.md · **Jarcube class:** PORTABLE

## Purpose

Four small subsystems that answer four operator questions: *what happened* (structured logging), *which
request did it belong to* (async request context), *how is the service behaving* (RED metrics), and *can I
get this install back* (backup and restore). Each one has exactly one non-obvious property, and each of
those properties exists because the naive version was wrong in production.

The four:

- Logging **redacts by key name**, and resolves its format from `NODE_ENV` rather than TTY detection.
- The request context is an `AsyncLocalStorage` store, so services deep in the call tree can attribute an
  audit record without threading the API key through every signature.
- RED metrics are recorded by a **pair** — middleware and interceptor — with an explicit ownership claim,
  because a request rejected by a guard never reaches the interceptor and would otherwise go uncounted.
- Backup resolves configuration through **the same three layers the app does**, because reading
  `process.env` only meant a dashboard-configured install was backed up at the default paths and exited 0.

OpenWA's own `docs/` set covers the operator procedures in its chapter 11, *Operational Runbooks* — when
to back up, how to recover, what to check. This doc covers the implementation those runbooks drive.

## File Inventory

Line counts as measured; they drift.

| Path | Lines | Role |
| --- | --- | --- |
| `src/common/services/logger.service.ts` | 223 | Structured logger, key-name redaction, JSON/pretty formats |
| `src/common/services/logger.module.ts` | 10 | `@Global()`, provides `LoggerService` + `ShutdownService` |
| `src/common/services/request-context.ts` | 51 | The ALS store: request id + resolved actor |
| `src/common/middleware/request-context.middleware.ts` | 20 | Assigns/validates the id, echoes the header, opens the scope |
| `src/common/middleware/request-metrics.middleware.ts` | 45 | The boundary half of the RED pair, plus the claim protocol |
| `src/common/interceptors/request-metrics.interceptor.ts` | 61 | The post-guard half |
| `src/common/metrics/request-metrics.ts` | 109 | `recordHttpRequest` and the in-process store |
| `scripts/lib-env.sh` | 60 | Three-layer config resolution for the shell scripts |
| `scripts/backup.sh` | 215 | Archive with a min-content gate and a consistency marker |
| `scripts/restore.sh` | 347 | Restore with `--strict` / `--force` and a pre-restore snapshot |
| `scripts/smoke-test-backup-restore.sh` | 334 | Five scenarios over the two scripts above |
| `scripts/smoke-test-docker-proxy.sh` | 80 | Asserts the API reaches the daemon through the proxy |
| `scripts/smoke-test-non-root.sh` | 63 | Asserts the built image runs as `openwa` |

Metrics content and the Prometheus surface are 64-metrics-and-stats.md; audit records are
63-audit-logging.md; health probes are 65-settings-and-health.md.

## Logging

`LoggerService` implements Nest's `LoggerService` interface and is `Scope.TRANSIENT`, so each injecting
class gets its own instance with its own `context` string. Level and format are **static** — one
process-wide setting each — while context is per-instance. `createLogger(context)` is the factory most of
the codebase uses directly rather than through DI, which is what lets non-injectable code
(`src/common/throttler/redis-throttler.storage.ts`, `src/modules/events/redis-io.adapter.ts`) log through
the same path.

### Redaction by key name

```ts
// src/common/services/logger.service.ts
const SECRET_KEY_PATTERN =
  /password|passwd|secret|token|api[-_]?key|authorization|credential|pepper|private[-_]?key/i;
```

`redactSecrets` walks the metadata object recursively to depth 4, replacing the **value** of any
secret-named key with `[REDACTED]`. The design choice is stated: it matches the key **name** only, never
the value's content, to avoid false positives on innocuous fields. It is defence in depth — a careless
`logger.info('…', { password })` cannot leak a credential — not the primary control. Arrays are mapped;
the depth bound stops a cyclic or pathological object.

### Format resolution

`resolveFormat()` checks an explicit `setLogFormat()` pin, then `LOG_FORMAT` (`json` or `pretty`), then
falls back to **`NODE_ENV === 'production' ? JSON : PRETTY`**.

That last step is deliberately *not* a TTY check, and the comment gives the reason: it mirrors NestJS's own
logger, which always prints its text format, and unlike TTY detection it stays correct when stdout is
piped through a dev runner — `concurrently` in `npm run dev` is the case that broke it.

Colour is a separate decision in `colorEnabled()`: honour `NO_COLOR`, then `FORCE_COLOR`, otherwise
colourise only a real TTY.

The pretty format deliberately mirrors NestJS's `ConsoleLogger` shape so the two log sources line up in one
terminal — same palette, `info` rendered as `LOG` with the same 7-character padding — but tagged honestly
as `[OpenWA]` rather than `[Nest]`. Structural keys (`timestamp`, `level`, `context`, `message`, `trace`)
go into the line prefix; everything else is appended dimmed as `key=value` pairs. Stack traces print on
their own lines.

The JSON entry is a flat object: `timestamp`, `level`, `context`, `message`, the spread metadata, and
`requestId` when one is active. `requestId` is spread **last**, so a metadata key of that name cannot
shadow the real one.

`shouldLog` compares indices in a fixed `[error, warn, info, debug, verbose]` array, so `LOG_LEVEL`
behaves as a threshold. `error()` folds its `trace` argument into the metadata object and accepts a string
*or* an object as its context parameter, matching Nest's signature.

## Request context

`src/common/services/request-context.ts` holds a dedicated `AsyncLocalStorage<RequestContext>` — the file
notes that multiple ALS instances coexist fine, and this one is independent of the plugin and hook stores.

| Function | Purpose |
| --- | --- |
| `runWithRequestId(id, fn)` | Opens the scope for `fn` and every async continuation it starts |
| `getRequestId()` | The active id, or `undefined` outside a request |
| `setRequestActor({ apiKeyId, apiKeyName, ipAddress })` | Stamps the resolved actor; **no-op outside a scope** |
| `getRequestActor()` | The actor, or `undefined` outside a scope |

The reason it carries the actor and not just the id is the useful part. Audit rows need to record *who*
called and *from where*, but most `auditService.log*()` call sites fire from deep inside services that
legitimately do not know the API key. Without the store, every controller would have to thread
`@CurrentApiKey()` and `req.ip` down through each call. The guard stamps it once; services read it.

`setRequestActor` returning silently outside a scope is what lets a worker or cron path call the same
service code without guarding.

The middleware is 20 lines:

```ts
// src/common/middleware/request-context.middleware.ts
const CLIENT_REQUEST_ID_PATTERN = /^[A-Za-z0-9-]{1,128}$/;
```

A client-supplied `X-Request-ID` is honoured **only** if it matches that pattern; anything else —
including a CRLF header-injection attempt — is discarded and a fresh `randomUUID()` is used. The id is
echoed on the response header before the scope opens, and `next` is called *inside*
`runWithRequestId`, which is what puts the whole downstream chain in scope.

`ipAddress` is documented as `ProxyAwareThrottlerGuard`'s notion of the client IP, honouring
`TRUSTED_PROXIES` — so the audited IP and the rate-limited IP are the same value by construction. See
52-rate-limiting.md.

## The RED metrics pair

This is the subsystem most worth reading closely, because the two halves only make sense together.

The problem: Nest runs middleware **before** guards, and interceptors **after** them. An interceptor
therefore never sees a request the throttler rejected with 429 or the API-key guard rejected with
401/403 — which are exactly the responses an operator most wants counted. But a middleware that counts
everything would double-count the requests the interceptor also sees.

The solution is an explicit **ownership claim** on the request object:

```mermaid
sequenceDiagram
  autonumber
  participant REQ as Request
  participant MW as requestMetricsBoundaryMiddleware
  participant G as Guards
  participant IC as RequestMetricsInterceptor
  participant H as Handler
  participant M as recordHttpRequest

  REQ->>MW: enters
  MW->>MW: start = hrtime.bigint(); attach finish/close listeners
  MW->>G: next()
  alt guard rejects (429 / 401 / 403)
    G-->>REQ: response
    Note over MW: unclaimed -> middleware records
    MW->>M: method, route, status, seconds
  else guard passes
    G->>IC: intercept
    IC->>IC: claimHttpRequestMetrics(req) synchronously
    IC->>H: next.handle()
    H-->>REQ: response
    Note over MW: already claimed -> middleware skips
    IC->>M: method, route, status, seconds
  end
```

`HTTP_REQUEST_METRICS_CLAIMED` is a `Symbol` property on the request; `claimHttpRequestMetrics(req)` sets
it and is idempotent. The interceptor claims **synchronously**, before `next.handle()`, so ordering is
not in question — the middleware's listeners fire at response time, long after.

Both halves share three further decisions:

**They listen on `finish` and `close`, not on the handler observable.** Exception filters set the final
`res.statusCode` *after* the interceptor's observable chain, so tapping the observable would record the
pre-filter status. `finish` sees the real one; `close` covers a premature client disconnect. A local
`recorded` flag (interceptor) or the claim flag (middleware) keeps it to one observation when both fire.

**Route labels are bounded, never raw URLs.** The interceptor prefers the Express route pattern
(`/api/sessions/:sessionId`), falling back to `Controller#handler`, which is always available and strictly
bounded. The middleware reads `req.route?.path` — available because guard rejections happen *after*
Express matched the route — and collapses unmatched paths (404s) into the single constant
`(unmatched)`. So there is no per-URL cardinality on either path.

**`/api/health` and `/api/metrics` are excluded** by prefix in both files, with the same one-line
justification: liveness probes and the scrape endpoint are not API traffic worth a RED series. A probe
every 5 s and a scrape every 30 s would otherwise dominate the histogram.

Duration is measured with `process.hrtime.bigint()` and converted to seconds as a float, matching the
Prometheus convention. Both call the same `src/common/metrics/request-metrics.ts:recordHttpRequest`.

## Backup and restore

Three shell scripts, all copied into the image (`Dockerfile` copies `backup.sh`, `restore.sh` and
`lib-env.sh` into `./scripts/`) because the operational runbook (`docs/`, chapter 11) drives them
in-container against the named-volume mount at `/app/data`. The `sqlite3` and `postgresql-client-17` packages in the image
exist for them — see 74-docker-and-compose.md.

### `scripts/lib-env.sh` — the three-layer resolution

`openwa_resolve KEY DEFAULT` reproduces the app's precedence: `printenv`, then `./.env`, then
`<data dir>/.env.generated`, then the built-in default. It is 60 lines and it fixes a specific, quiet
data-loss mode.

The header states it exactly: the scripts used to read layer 1 only, so an install configured through the
dashboard was backed up at the **default** paths. And that failure is not reliably loud — a *missing*
database fails the run, but a database left at a default path from **before** the operator switched is
archived instead, and the run exits 0. A backup that captured an abandoned database only reveals itself
during a restore.

Parsing is deliberately conservative: only a plain `KEY=value` line is honoured. A value carrying quotes
or a `#` is **reported to stderr and skipped** rather than guessed at, because a silently mis-parsed path
is the exact failure the file exists to prevent. Nothing is exported — each key is looked up by name, so a
stray entry in an operator's `.env` can never reach the script's own environment.

### `scripts/backup.sh`

`set -euo pipefail` and `umask 077`, because the archive contains bootstrap credentials and generated
database secrets and must not inherit a permissive operator umask.

What is captured:

| Member | Source | Note |
| --- | --- | --- |
| `main.sqlite` | `MAIN_DATABASE_NAME` | Auth + audit. **Required.** |
| `openwa.sqlite` or `database.sql` | `DATABASE_NAME`, or `pg_dump` | Depending on `DATABASE_TYPE` |
| `sessions/` | `SESSION_DATA_PATH` | whatsapp-web.js LocalAuth |
| `baileys/` | `BAILEYS_AUTH_DIR` | Baileys auth state |
| `media/` | `STORAGE_LOCAL_PATH` | Skipped automatically on S3 |
| `plugin-packages/` | `PLUGINS_DIR` | Installed plugin code |
| `plugin-state/` | `PLUGIN_STATE_DIR` + `/plugins` | Registry and persisted `ctx.storage` |
| `.env.generated`, `.api-key` | data dir | Dashboard config and the plaintext bootstrap admin key |

The header records what this list replaced: the previous runbook backed up the **wrong file**
(`openwa.db`) and omitted `main.sqlite` entirely, so a "successful" backup silently lost every API key and
all audit history.

Two resolution rules are called out as easy to get wrong:

- **Database paths are not derived from `OPENWA_DATA_DIR`.** They resolve exactly like the app, and the
  app never derives them either. `OPENWA_DATA_DIR` bases only the non-DB state directories; deriving DB
  paths from it would back up files the app never reads.
- **`PLUGINS_DIR` and `PLUGIN_STATE_DIR` are resolved separately**, because the knob names the *root*, not
  the plugins directory inside it. Hardcoding `$DATA_DIR/plugins` meant an operator who moved plugin state
  got an archive with neither the registry nor any plugin's storage, and a restore that put nothing back.

Three correctness gates:

1. **A missing source database is fatal.** An archive without the configured databases is not a backup, and
   a silent skip is how an empty archive gets reported as "Backup complete".
2. **The `CONSISTENCY-WARNING` marker.** With `sqlite3` present, `sqlite3 "$src" ".backup '$dest'"` takes
   an online-consistent snapshot without stopping the app. Without it, the database is plain-copied
   (possibly torn) and a marker file is written **inside the archive** listing each plain-copied file, so
   `restore.sh` can surface it later.
3. **The post-archive min-content check.** After `tar -czf`, `tar -tzf` is compared against
   `REQUIRED_MEMBERS`. A defective archive is **deleted** and the run fails — leaving it on disk invites a
   restore into a fresh-empty install (new API keys, new master key) reported as success.

`pg_dump` prefers a resolved `DATABASE_URL` and otherwise assembles host/port/user/db with `PGPASSWORD`
supplied inline. A missing `pg_dump` with `DATABASE_TYPE=postgres` is a hard error, which is precisely why
the image ships client 17.

### `scripts/restore.sh`

Same `set -euo pipefail` and `umask 077`. Two flags:

| Flag | Effect |
| --- | --- |
| `--strict` | Refuse an archive whose `CONSISTENCY-WARNING` reports plain-copied snapshots. Without it, the restore continues after a loud warning. |
| `--force` | Overwrite databases that already hold a working install's data. Without it, the restore **refuses to touch a live target before changing anything**. |

Argument parsing rejects unknown options and a second positional argument rather than guessing. Restore
targets resolve identically to backup's, and the header repeats the warning: they are **not** derived from
`OPENWA_DATA_DIR`, because restoring there would write databases the app never reads — producing a
fresh-empty boot with a new master key, which looks like a failed restore for a reason that is hard to see.

A snapshot of the current data directory is taken **before** anything is written, so a bad restore can be
undone. PostgreSQL dumps are staged for an explicit `psql` import command printed at the end rather than
being applied automatically — the one destructive step the script declines to take for you.

The app must be stopped first, and the header says so.

## Smoke tests

Three shell smoke tests cover things no unit test can observe.

`scripts/smoke-test-backup-restore.sh` (334 lines) is the most thorough, with five named scenarios in its
header: custom `MAIN_DATABASE_NAME` / `DATABASE_NAME` honoured by **both** scripts; a missing source
database failing hard with no archive left behind; a full roundtrip via `sqlite3 .backup`; the `cp`
fallback writing the marker, restore warning but continuing, and `--strict` refusing; and the min-content
check rejecting *and deleting* an archive missing a required DB. `sqlite3` is optional — the roundtrip
scenario is skipped with a notice and everything else still runs.

`scripts/smoke-test-docker-proxy.sh` (80 lines) checks `/api/health`, then reads `/api/infra/status` with
an admin key and asserts the Docker availability flag `DockerService.isDockerAvailable()` produces. It
takes the API key as an argument and requires the stack to be up.

`scripts/smoke-test-non-root.sh` (63 lines) asserts the built image runs its process as `openwa`. Two
details show it has been maintained: `DOCKER_BUILDKIT=1` is forced on because the Dockerfile's
`$BUILDPLATFORM` builder pin requires BuildKit, and `OPENWA_SMOKE_IMAGE` lets CI reuse an already-built
tag instead of paying for a second build — with cleanup removing **only** an image the script built
itself, never one the caller handed it.

## Call Chain

- `src/configure-app.ts` → `src/common/middleware/request-context.middleware.ts:requestContextMiddleware`
  → `src/common/services/request-context.ts:runWithRequestId` — adds the async scope every log line and
  audit row reads from
- API-key guard → `src/common/services/request-context.ts:setRequestActor` → audit writes deep in services
  — adds attribution without threading the key through every signature
- `src/common/services/logger.service.ts:LoggerService.writeLog` → `getRequestId` — adds the request id to
  every line inside a request scope, absent at boot and in workers
- `src/common/middleware/request-metrics.middleware.ts:requestMetricsBoundaryMiddleware` +
  `src/common/interceptors/request-metrics.interceptor.ts:RequestMetricsInterceptor` →
  `src/common/metrics/request-metrics.ts:recordHttpRequest` — adds exactly one RED observation per response
  across the pair
- `scripts/backup.sh` → `scripts/lib-env.sh:openwa_resolve` — adds the app's config precedence to a shell
  script that would otherwise see only `process.env`

## Configuration

| Env var | Default | Effect |
| --- | --- | --- |
| `LOG_LEVEL` | `info` | Threshold over `[error, warn, info, debug, verbose]` |
| `LOG_FORMAT` | unset | `json` or `pretty`; unset resolves from `NODE_ENV` |
| `NODE_ENV` | — | `production` selects JSON output |
| `NO_COLOR` / `FORCE_COLOR` | unset | Colour override, checked before TTY detection |
| `TRUSTED_PROXIES` | unset | Decides the client IP that reaches both the throttler and the audit row |
| `METRICS_TOKEN` | unset | Without it `/api/metrics` returns 404. See 64-metrics-and-stats.md. |
| `OPENWA_DATA_DIR` | `./data` | Bases the **non-DB** state directories only |
| `BACKUP_DIR` | `./backups` | Where archives are written |
| `MAIN_DATABASE_NAME` / `DATABASE_NAME` | `./data/main.sqlite` / `./data/openwa.sqlite` | Resolved through all three layers by both scripts |
| `DATABASE_TYPE` | `sqlite` | Selects the `pg_dump` branch |
| `DATABASE_URL` | unset | Preferred `pg_dump` connection form |
| `SESSION_DATA_PATH`, `BAILEYS_AUTH_DIR`, `STORAGE_LOCAL_PATH`, `PLUGINS_DIR`, `PLUGIN_STATE_DIR` | see 05-configuration-and-env.md | Override the corresponding state directories |
| `OPENWA_SMOKE_IMAGE` | unset | Reuse a prebuilt tag in the non-root smoke test |

Full list: APPENDIX-A-env-vars.md.

`OPENWA_DATA_DIR` and `BACKUP_DIR` steer the scripts themselves and are never written to an env file, so
they stay environment-only. Everything below them is application configuration and goes through
`openwa_resolve`.

## Events Emitted / Consumed

None from these files directly. `X-Request-ID` is echoed on every response and stamped into every log
line and audit row, which is the correlation key an operator uses to join the three.
Full list: APPENDIX-B-events.md.

## Failure Modes & Edge Cases

| Scenario | Behaviour | Pinned by |
| --- | --- | --- |
| A credential passed in log metadata | Value replaced by `[REDACTED]` by key name, to depth 4 | — |
| A secret in the log *message* string | **Not** redacted — only metadata keys are inspected | — |
| stdout piped through a dev runner | Pretty format retained, because the choice is `NODE_ENV`-based rather than TTY-based | — |
| Log outside a request scope (boot, worker, cron) | `requestId` simply absent from the entry | — |
| Client sends `X-Request-ID` with CRLF | Discarded; a fresh UUID is generated | — |
| Client sends a valid id | Honoured and echoed, so a caller can correlate its own trace | — |
| `setRequestActor` called from a worker | No-op; callers need no guard | — |
| Request rejected by the throttler (429) | Counted by the middleware, since the interceptor never ran | `src/common/metrics/request-metrics.spec.ts` |
| Request rejected by the API-key guard (401/403) | Same path; `req.route.path` is available because Express already matched | `src/common/metrics/request-metrics.spec.ts` |
| Request that passes guards | Claimed by the interceptor; the middleware skips it | `src/common/metrics/request-metrics.spec.ts` |
| Both `finish` and `close` firing | One observation, via the `recorded`/claim flag | — |
| Exception filter rewriting the status | The real status is recorded, because `finish` fires after the filter | — |
| 404 on an unmatched path | Collapsed to the constant `(unmatched)` label | — |
| Health probe or metrics scrape | Excluded by prefix in both halves | — |
| Backup on a dashboard-configured install | Correct paths, via `openwa_resolve` | `scripts/smoke-test-backup-restore.sh` |
| `.env` value with quotes or a `#` | Reported on stderr and skipped, never guessed | `scripts/smoke-test-backup-restore.sh` |
| Missing source database | Fatal; no archive is produced | `scripts/smoke-test-backup-restore.sh` |
| No `sqlite3` on the host | Plain copy + `CONSISTENCY-WARNING` inside the archive | `scripts/smoke-test-backup-restore.sh` |
| Restoring a marked archive | Loud warning and continue; `--strict` refuses | `scripts/smoke-test-backup-restore.sh` |
| Archive missing a required member | Deleted and the run fails | `scripts/smoke-test-backup-restore.sh` |
| Restore onto a live install without `--force` | Refused **before** anything is changed | — |
| Restore of a Postgres dump | Staged; the `psql` command is printed rather than run | — |
| Bad restore | Undoable from the pre-restore snapshot of the data directory | — |
| `pg_dump` absent with `DATABASE_TYPE=postgres` | Hard error naming the missing tool | — |

## Jarcube Portability

**Classification:** PORTABLE

**Rationale:** All four subsystems are transport-independent. The RED pair and the request context are
generic NestJS/Express concerns; the logger is a plain implementation of Nest's interface; the backup
scripts are about *which files hold state*, and only that list is OpenWA-specific.

**Prerequisites:** 05-configuration-and-env.md if you port `lib-env.sh`, since its whole purpose is to
reproduce that precedence chain outside the process.

**Cloud API caveats:** none for logging, context or metrics. The backup **inventory** changes
substantially: no `sessions/`, no `baileys/`, no engine auth state at all. Jarcube's equivalent is its
per-bot access tokens and webhook verify tokens, which live wherever it keeps them — and if that is a
managed database rather than a mounted volume, the shell-script shape may not be the right one at all.

**Specific recommendations for Jarcube:**

1. **Take the RED middleware/interceptor pair with its claim protocol.** This is the highest-value item
   here. An interceptor-only implementation silently omits every 401, 403 and 429 — the exact statuses an
   operator watches — and the omission is invisible because the dashboard still shows traffic. The claim
   symbol is ~10 lines.
2. **Take `finish`/`close` over tapping the observable.** Recording the pre-exception-filter status is a
   subtle and permanent inaccuracy: 500s show up as 200s.
3. **Take the bounded route label with the `(unmatched)` collapse.** Raw URLs in a Prometheus label is the
   standard way to blow up a time-series database, and 404 scanning traffic is how it happens in practice.
4. **Take `request-context.ts` whole.** Fifty-one lines of `AsyncLocalStorage` that remove an actor
   parameter from every service signature. The no-op-outside-a-scope property is what makes it safe to use
   from cron and worker paths.
5. **Take the request-id validation pattern.** Honouring a client-supplied correlation id is genuinely
   useful and the CRLF injection risk is real; a 128-char alphanumeric-plus-dash allowlist settles both.
6. **Take key-name redaction as defence in depth**, and keep the "name not value" decision. Value-based
   detection produces false positives on ordinary fields, and a log line mangled by an over-eager redactor
   is its own operational problem.
7. **Take `NODE_ENV`-based format resolution over TTY detection.** The dev-runner pipe case is exactly the
   situation where TTY detection gives the wrong answer and nobody notices for a while.
8. **Port `lib-env.sh`'s idea, not necessarily its code.** If any operational script needs to know a path
   the application resolves through layers, it must resolve it the same way — and the conservative
   parse-or-report rule is the right posture for a script whose mistakes are only discovered during a
   recovery.
9. **Take the three backup gates.** Fatal-on-missing-source, an in-archive consistency marker, and a
   post-archive min-content check that *deletes* a defective archive. Each one converts a silent
   "Backup complete" into a loud failure, and a backup you cannot trust is worse than none.
10. **Take the refuse-before-changing-anything default in restore.** `--force` as an opt-in, with a
    pre-restore snapshot taken regardless, is the right default for a destructive operation.

## Open Questions

- `LoggerService` holds level and format as **static** fields while being `Scope.TRANSIENT`. That is
  consistent (one process-wide setting, many contexts) but means `setLogLevel` from a test leaks across
  instances. Whether tests rely on that is not determinable from these files.
- Redaction covers metadata only, not the message string. Whether message-side redaction was considered
  and rejected as too false-positive-prone is not recorded.
- The redaction depth bound is 4 with no override. Whether that was measured against real metadata shapes
  is not stated.
- `RequestContext` carries `apiKeyId`, `apiKeyName` and `ipAddress` today, and the doc comment says
  "today" — implying planned additions. What those would be is not indicated.
- `scripts/restore.sh` stages a Postgres dump and prints the `psql` command rather than running it, while
  `backup.sh` runs `pg_dump` directly. The asymmetry is defensible (import is the destructive half) but is
  not explained in either script.
- The smoke tests are shell scripts run by hand or by CI rather than part of `npm test`. Which CI jobs
  invoke which of the three is covered in 97-ci-cd-and-release-gates.md; the scripts themselves do not say.
