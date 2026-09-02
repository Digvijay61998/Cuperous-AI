# Storage Adapters

> **Source of truth:** `src/common/storage/storage.service.ts`, `src/common/storage/storage-local-files.ts`, `src/common/storage/storage-transfer.ts`, `src/common/storage/orphan-sweep.ts`, `src/common/storage/storage.module.ts`, `src/common/utils/path-safety.ts`
> **Band:** Data and infrastructure · **Depends on:** 05-configuration-and-env.md · **Jarcube class:** PORTABLE

## Purpose

One `StorageService` over two backends — a local directory and any S3-compatible bucket — with a
deliberately asymmetric fallback: when S3 is configured but unreachable, writes go to the local
directory and reads transparently fall through to it. That decision is what makes the rest of this
module more complicated than a two-branch adapter would be, and it is the right decision: a media
write that fails because a bucket is briefly unreachable would otherwise lose the only copy of an
inbound attachment.

The two things a naive implementation gets wrong here are **completeness versus DoS bounds** (the
capped listing is not the same operation as the full enumeration, and using one where the other is
required silently loses files) and **path containment on a backend with no filesystem** (an S3 key has
no root to resolve against, so `isPathWithin` cannot guard it).

## File Inventory

Line counts as measured; they drift.

| Path | Lines | Role |
| --- | --- | --- |
| `src/common/storage/storage.service.ts` | 534 | Backend selection, S3 client + re-probe, the safe-key boundary, read-through/delete-through |
| `src/common/storage/storage-local-files.ts` | 97 | Local list/iterate/get/put/delete, each with its own containment guard |
| `src/common/storage/storage-transfer.ts` | 184 | tar.gz export and import, with decompression-bomb bounds |
| `src/common/storage/orphan-sweep.ts` | 89 | Shared reconciliation pass with a grace window |
| `src/common/storage/storage.module.ts` | 11 | `@Global()` module, one provider |
| `src/common/utils/path-safety.ts` | 44 | `isPathWithin`, `isSafeStorageKey`, `isSafeSessionName` |

Specs: `src/common/storage/storage.service.spec.ts` (381),
`src/common/storage/storage.service.s3.spec.ts` (136),
`src/common/storage/storage.service.s3-reprobe.spec.ts` (308).

The two consumers that persist media alongside DB rows are the status store (36-status-stories.md) and
the chat-media archive (34-media-pipeline.md). Export/import as an operator workflow is
66-infra-management.md.

## Backend selection

`STORAGE_TYPE` is validated to `local` or `s3` at boot, because the selection swallows unknown values —
see 05-configuration-and-env.md.

The S3 client is only constructed when `storageType === 's3'` **and** both credentials are present.
Endpoint handling carries a fix worth naming:

```ts
// src/common/storage/storage.service.ts — endpoint-conditional options
...(endpoint ? { endpoint } : {}),
region,
credentials: { accessKeyId, secretAccessKey },
...(endpoint ? { forcePathStyle: true } : {}),
```

Standard AWS S3 needs only credentials and a region — the SDK derives the regional endpoint — and an
explicit `endpoint` is required *only* for S3-compatible stores like MinIO or R2. Requiring it dropped
valid AWS configurations to a silent local fallback. `forcePathStyle` is tied to the same condition
because it is a path-style concern; AWS uses virtual-hosted addressing.

Credential names have a canonical and a legacy spelling, both read:
`S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` win, `S3_ACCESS_KEY` / `S3_SECRET_KEY` are the fallback so
existing `.env` files keep working.

The local directory is created with `mkdirSync(recursive)` in the constructor **regardless of backend**,
because it doubles as the S3 fallback target.

### Availability is one-way

`initializeS3Bucket()` runs a `HeadBucket`; on `NotFound`/`NoSuchBucket` it attempts `CreateBucket`.
Failure of either logs and calls `warnLocalFallback()`, which states the degradation in the log line
including the re-probe interval.

`startS3Reprobe()` then polls every `S3_REPROBE_INTERVAL_MS` (default 60 000) while unavailable, and
**stops the timer the moment S3 comes back**. `refreshS3Availability()` is the shared probe, throttled
to 10 s and in-flight-deduped so the status endpoint and the periodic timer can both call it cheaply.

The transition is deliberately one-directional — `s3Available` only ever goes false → true — so a
session already on S3 is never dropped to local by a transient error without an explicit
re-evaluation. Recovery logs at **warn**, not info, and the message says why: media written to the
local fallback during the outage stays local-only. Reads keep working through the read-through, but the
operator should know a split exists. The timer is `unref()`'d and cleared in `onModuleDestroy`.

## The safe-key boundary

`getFile`, `putFile` and `deleteFile` all begin with the same check:

```ts
// src/common/storage/storage.service.ts
if (!isSafeStorageKey(filePath)) {
  throw new Error(`Refusing to store an unsafe storage key: ${filePath}`);
}
```

The local helpers each carry their own `isPathWithin` guard, so the centralised check exists for the S3
branch: `putS3File` builds `` `media/${filePath}` `` and **an S3 key has no host filesystem root to
resolve against**, so `isPathWithin` is not applicable to it at all.

`src/common/utils/path-safety.ts:isSafeStorageKey` rejects: an empty or non-string key, any character in
`\u0000-\u001f` (harmless on a local filesystem but a NUL would reach the raw S3 object key), an
absolute path, and any `..` segment after splitting on both separators. Ordinary keys keep working,
including plugin- and JID-style ones containing `:`, `@`, `.` and `-`.

`isPathWithin(root, target)` resolves both to absolute paths and requires either equality or a
`root + path.sep` prefix — the separator check is what stops `/data-evil` from counting as inside
`/data`.

`isSafeSessionName` is the third guard in the file and belongs to a different sink: a session name
becomes the engine auth-directory key (`path.join(authDir, name)`), so a `.`, `/` or `\` could traverse
out of it — arbitrary write, and `rm -rf` on teardown. It enforces the same conservative
`^[a-zA-Z0-9-]+$` charset the create DTO does, as the sink-side guard for paths that carry a raw name
(data import, seeding). See 51-security-controls.md.

## Read-through, delete-through, list-union

Four operations have an extra branch that exists only because of the local fallback.

| Operation | Extra behaviour | Why |
| --- | --- | --- |
| `getS3File` | On `NoSuchKey` only, retry the local copy; if that misses too, rethrow the **original S3 error** | Media written during an outage lives only locally. A plain S3 read would `NoSuchKey` on a file the app served fine an hour earlier. Rethrowing the original keeps not-found semantics unchanged. |
| `deleteFile` | Deletes from **both** backends when S3 is active | The key may exist only in the fallback dir; deleting just the S3 object orphans those bytes permanently once the caller drops its DB reference |
| `listFiles` / `iterateFiles` | Union S3 keys with local keys, each once | A listing that omits local-only files contradicts what reads serve, and a sweep reconciling against it could never reclaim them |
| `getFileCount` | Union, with the S3 copy authoritative for a key present in both | Same split-brain gap; a local-only file counts at its real on-disk size |

Missing-file is success on both delete paths — local ENOENT is swallowed, S3 `DeleteObject` is
idempotent by design — so callers never special-case "already gone".

`isMissingObjectError` is exported for the same reason `db-errors.ts` exists: the two backends report a
miss differently. Local raises a POSIX `ENOENT` (a `.code`); S3 raises `NoSuchKey`/`NotFound`, which
carries a `.name` and **no `.code` at all**. Checking only `.code` turns a missing S3 object into a 500
on the one backend where retention and bucket lifecycle rules make a miss most likely. The predicate
also accepts a 404 in `$metadata.httpStatusCode`.

## Capped listing versus full enumeration

This is the distinction that matters most in this module, and the source states it repeatedly because
spending the wrong one caused a real data-loss bug.

| Method | Bound | Contract |
| --- | --- | --- |
| `listFiles()` | `STORAGE_LIST_MAX_FILES`, default 100 000 | A **per-call DoS guard**. Stops early, returns without logging or throwing. |
| `iterateFiles(prefix?)` | none on count; depth-bounded locally | A **completeness contract**. Streams every key. |

`createExportStream` uses the uncapped walk. The comment records what happened when it used the capped
one: the documented local → S3 migration (export, repoint `STORAGE_TYPE`, import) left media behind on
the old backend **silently**, and the operator's own files/count pre-check was truncated by the same
path, so the consistency check could not reveal the gap. `getFileCount` is uncapped for exactly that
reason — it is the pre-check an operator runs before the migration.

`iterateFiles(prefix)` narrows the walk **at the source** — the S3 `ListObjectsV2` prefix and the local
traversal root — so a caller reconciling one subtree neither pages the whole store nor holds every key
of it in the dedupe `Set`. Removing a per-call cap must not trade one unbounded read for another.

### The local traversal

`iterateLocalFiles` is an iterative BFS over a `[relativeDir, depth]` queue, not recursion, so a deep or
wide media tree can neither blow the call stack nor block the event loop. `LOCAL_TRAVERSAL_MAX_DEPTH` is
20 — the count cap is removed, the depth bound is not. A prefix ending in `/` names a subtree and starts
the walk there, guarded by `isPathWithin` first. An unreadable or vanished directory is skipped rather
than aborting the whole traversal.

Every local I/O call is the `fs.promises` form, and each site says why: `getFileCount` awaits its
`stat` per file because uncapping the walk also uncapped the loop, and a synchronous stat per file holds
the event loop for the whole store — health checks, webhooks and every in-flight request queue behind a
file count. The measured note in the source is one event-loop tick for 2000 files.

## Export and import

`src/common/storage/storage-transfer.ts` produces and consumes a gzipped tar.

**Export** streams into a `PassThrough`. An `archive.on('error')` handler destroys the output stream, so
a gzip or finalize failure surfaces on the returned stream instead of becoming an unhandled rejection or
a silently truncated download, and `finalize()`'s own rejection is caught for the same reason. A
per-file read failure is logged at warn and skipped — one unreadable file does not abort the archive.

There is one genuinely thoughtful check at the top: if the file count exceeds the *import* entry limit,
export warns **now**. The comparison is against the **lower** of this deployment's configured
`STORAGE_IMPORT_MAX_ENTRIES` and the shipped default (100 000). The reasoning is worth quoting in
paraphrase: the default alone is destination-agnostic, which is right when restoring elsewhere, but it
stays silent for an operator who *lowered* the limit here and restores onto this same gateway — the one
destination whose limit is actually known. Without the warning, an operator discovers the archive is
unrestorable at restore time, after decommissioning the source.

**Import** is explicitly documented as **best-effort, not atomic**, with two different failure
granularities:

| Failure | Handling |
| --- | --- |
| One bad or traversing entry | Skipped (via `putFile`'s safe-key rejection); the rest still import |
| Entry over `STORAGE_IMPORT_MAX_BYTES` (200 MiB, 4× the inbound media cap) | **Aborts the whole import** — a per-entry overflow is a zip-bomb signal, not a per-file skip |
| More than `STORAGE_IMPORT_MAX_ENTRIES` entries | Aborts the whole import |

Aborting tears down `extract`, `gunzip` and the input stream and rejects, so nothing further is buffered
or written. Entries already written are **kept** — there is no rollback. Re-running an import is safe
because `putFile` overwrites. The source names the alternative it did not build: a staging directory
plus an atomic promote would make it transactional.

Every stream in the pipeline gets an `error` listener, and the comment states the stakes: an
`EventEmitter` with no error listener **crashes the process**, and `pipe()` does not forward errors — so
a corrupt gzip or a disk read failure would otherwise kill the server mid-request instead of failing the
import.

## Orphan sweeping

`src/common/storage/orphan-sweep.ts` is one shared reconciliation pass, used by both stores that keep
media blobs alongside DB rows. They share a bucket, so each caller scopes itself to its own prefix and
never touches the other's files.

```mermaid
sequenceDiagram
  autonumber
  participant CALLER as Sweep caller
  participant SW as sweepOrphanedFiles
  participant ST as StorageService
  participant DB as referencedAmong

  CALLER->>SW: prefix, graceMs, now, firstSeenAt map, chunkSize
  loop iterateFiles(prefix)
    SW->>ST: next key
    SW->>SW: buffer into chunk
    opt chunk full
      SW->>DB: referencedAmong(chunk)
      DB-->>SW: referenced set (may be a superset)
      SW->>SW: referenced -> forget; unreferenced -> record first sighting
      SW->>ST: deleteFile only when now - firstSeen >= graceMs
    end
  end
  SW->>SW: prune firstSeenAt to keys still orphaned
  SW-->>CALLER: number deleted
```

Five properties, each chosen against a specific failure:

- **The grace window.** A file is deleted only after the sweep has seen it unreferenced for at least
  `graceMs`, so a file mid-write is never reaped.
- **First-seen state is caller-owned and in memory.** A restart simply restarts the grace clock, which
  fails safe.
- **The map is pruned to keys still orphaned at the end of the pass**, so it is bounded by the orphan
  count (normally ~0) rather than by the size of the store.
- **`referencedAmong` may return a superset.** Only membership is read, so a caller with a small bounded
  referenced set can answer with one whole-set query instead of a per-chunk one.
- **`chunkSize` bounds each lookup.** Set it when the referenced set can grow without bound: chunking
  keeps each call an indexed query over a bounded key list instead of materialising every key and every
  referenced row at once. This is what `IDX_messages_mediaPath` backs — see 70-database-design.md.

`iterateFiles` is used rather than `listFiles`, and the header says why: the cap would strand every
orphan past it, permanently. A failed delete is reported through the caller's `onDeleteFailed` and
retried on the next pass; the summary log stays with the caller so each sweep reports in its own
wording.

## Call Chain

- consumer → `src/common/storage/storage.service.ts:putFile` → `src/common/utils/path-safety.ts:isSafeStorageKey`
  → backend write — adds containment for both backends at one boundary
- `src/common/storage/storage.service.ts:getFile` → `getS3File` → `getLocalFile` on `NoSuchKey` — adds
  read-through so an outage-era write stays readable
- `src/common/storage/storage.service.ts:createExportStream` → `listAllFiles` → `iterateFiles` →
  `storage-transfer.ts:createExportStream` — adds completeness where the capped listing would truncate
- sweep caller → `src/common/storage/orphan-sweep.ts:sweepOrphanedFiles` → `iterateFiles(prefix)` +
  `referencedAmong` + `deleteFile` — adds a grace window and chunked reconciliation
- `src/common/storage/storage.service.ts:refreshS3Availability` ← infra status endpoint and the periodic
  re-probe — adds throttling and in-flight dedupe so both callers are cheap

## Configuration

| Env var | Default | Effect |
| --- | --- | --- |
| `STORAGE_TYPE` | `local` | `local` or `s3`, validated at boot |
| `STORAGE_LOCAL_PATH` | `./data/media` | Local root; also the S3 fallback directory |
| `S3_ENDPOINT` | unset | Set only for S3-compatible stores; also enables `forcePathStyle` |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | unset | Canonical credentials; both required to construct the client |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` | unset | Legacy spellings, read as a fallback |
| `S3_REGION` | `us-east-1` | |
| `S3_BUCKET` | `openwa` | Created on `NotFound` if the role permits |
| `S3_REPROBE_INTERVAL_MS` | `60000` | Re-probe cadence while degraded (`DEFAULT_S3_REPROBE_INTERVAL_MS`) |
| `STORAGE_LIST_MAX_FILES` | `100000` | Per-call listing cap. **Not** a completeness bound. |
| `STORAGE_IMPORT_MAX_BYTES` | `209715200` | Per-entry import cap (200 MiB) |
| `STORAGE_IMPORT_MAX_ENTRIES` | `100000` | Import entry-count cap; also what export warns against |
| `MINIO_BUILTIN` | `false` | Asks `src/modules/docker/docker.service.ts` to start a bundled MinIO. See 74-docker-and-compose.md. |

Full list: APPENDIX-A-env-vars.md.

Note that the three numeric bounds are parsed locally by a `positiveIntFromEnv` helper duplicated in
`storage.service.ts`, `storage-local-files.ts` and `storage-transfer.ts` rather than going through
`ConfigService`. Each requires an integer `> 0` and falls back otherwise, so a blank or malformed value
cannot disable the bound it guards.

## Events Emitted / Consumed

None directly. Sweep results are logged by their callers, and export/import through the infra module
raise `INFRA_STORAGE_EXPORTED` / `INFRA_STORAGE_IMPORTED` audit actions — see 63-audit-logging.md.
Full list: APPENDIX-B-events.md.

## Failure Modes & Edge Cases

| Scenario | Behaviour |
| --- | --- |
| `STORAGE_TYPE=s3` with no credentials | No client is constructed; every operation is local, silently |
| Bucket unreachable at boot | `warnLocalFallback` logs the degradation; writes go local; re-probe every 60 s |
| Bucket recovers | Logged at **warn**, timer stops, writes return to S3; outage-era files stay local |
| Read of an outage-era key after recovery | Served through the local read-through; a debug line records it |
| Read of a key in neither backend | The **original S3 error** is rethrown, so not-found semantics are unchanged |
| Delete while S3 is active | Both backends, so fallback bytes are never orphaned |
| Key with `..`, absolute, or a control character | Rejected at `getFile`/`putFile`/`deleteFile` before either backend is touched |
| Traversing tar entry name | Rejected by `putFile`; that entry is skipped, the import continues |
| Import entry over the byte cap | Whole import aborted; already-written entries kept |
| Import archive over the entry cap | Whole import aborted at that entry |
| Corrupt gzip on import | `gunzip` error listener fails the import instead of crashing the process |
| Export over the import limit | Warned at export time, naming both this deployment's limit and the shipped default |
| Store larger than `STORAGE_LIST_MAX_FILES` | `listFiles` truncates **without logging**; export, count and sweeps use the uncapped walk instead |
| Media tree deeper than 20 levels | Not traversed below the bound |
| Unreadable subdirectory | Skipped; the traversal continues |
| File written between sweep passes | Protected by the grace window |
| Process restart mid-grace | Clock restarts — fails safe, nothing is reaped early |
| Delete failure during a sweep | Reported via `onDeleteFailed`, retried next pass |

## Jarcube Portability

**Classification:** PORTABLE

**Rationale:** Nothing here knows anything about WhatsApp. It is a media store with a bounded
enumeration contract, a containment boundary and a reconciliation pass — all of which any service
handling user-supplied attachments needs.

**Prerequisites:** none. This is a good candidate for an early port wave.

**Cloud API caveats:** Meta's Cloud API serves inbound media from its own URLs behind a token, so
Jarcube's *ingest* path differs — it fetches from Meta rather than receiving bytes from an engine. What
happens after ingest is identical, so `StorageService` is a drop-in for the persist/serve half.

**Specific recommendations for Jarcube:**

1. **Take `src/common/utils/path-safety.ts` verbatim.** Forty-four lines, three guards, and the
   `isSafeStorageKey`-for-S3 rationale is the kind of thing that is obvious in hindsight and absent in
   most implementations.
2. **Take the capped-versus-complete distinction as an explicit API contract**, not a comment. Two
   differently named methods with the difference stated in each doc comment is what stopped the
   truncated-export bug from recurring. If Jarcube has one `list()`, decide which it is and name it so.
3. **Take `orphan-sweep.ts` whole.** It is 89 lines and it is generic — a prefix, a grace window, a
   membership resolver and a caller-owned first-seen map. The grace window and the fails-safe restart
   behaviour are the two properties that make an automatic deleter safe to run.
4. **Take the `isMissingObjectError` shape** if Jarcube supports more than one storage backend. The
   `.code` versus `.name` asymmetry turns a routine miss into a 500 on precisely the backend where
   misses are expected.
5. **Take the every-stream-needs-an-error-listener rule** for any tar/gzip pipeline. An unhandled
   stream error crashes the process, and `pipe()` will not save you.
6. **Decide the fallback question deliberately.** The local-fallback-on-S3-outage behaviour is genuinely
   useful and genuinely complex — it is the source of the read-through, the delete-through, the
   list-union and the one-way availability latch. If Jarcube would rather fail a write than accept a
   split store, it can drop four features at once.
7. **Route the numeric bounds through config** rather than duplicating a `positiveIntFromEnv` helper in
   three files. The behaviour is right; the duplication is the sort of thing that drifts.

## Open Questions

- `positiveIntFromEnv` is defined three times in this module with identical bodies. Whether that is to
  keep `storage-local-files.ts` and `storage-transfer.ts` free of a shared import, or simply drift, is
  not recorded.
- `putS3File` sets no `ContentType` on `PutObject`, so archived media is stored with S3's default. The
  read endpoint sources its Content-Type from the `mediaMimetype` column instead, which works — but
  whether omitting it on the object was a decision is not stated.
- The S3 availability latch is one-way by design, and `refreshS3Availability` returns early when
  already available. So an S3 backend that becomes unreachable **after** a successful boot probe is never
  marked unavailable, and writes keep going to S3 and failing. Whether a downward transition is handled
  elsewhere could not be determined from this module.
- `LOCAL_TRAVERSAL_MAX_DEPTH` is a hardcoded 20 with no override, while every sibling bound is
  env-tunable. Whether 20 is a considered ceiling for the key layouts in use is not stated.
