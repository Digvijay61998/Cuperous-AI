# Session Fences and the Invariant Catalog

> **Source of truth:** `src/modules/session/session-lifecycle-fences.ts`, `src/modules/session/session-engine-controls.ts`, `src/modules/session/session-engine-lifecycle.service.ts`, `src/modules/session/session-engine-event-wiring.ts`, `src/modules/session/session.service.ts`, `src/modules/session/logout-teardown-race.spec.ts`, `src/modules/session/session-lifecycle-fences.spec.ts`
> **Band:** Session domain · **Depends on:** 11-engine-factory-registry.md, 20-session-lifecycle.md · **Jarcube class:** ENGINE-COUPLED

## Purpose

Every lifecycle operation in this module is a multi-step sequence over four things that can be mutated
independently: a database row, an in-memory registry entry, an OS process, and a directory on disk. None
of them is transactional with the others, all four can be touched concurrently by an HTTP request, a
timer, an engine callback, a watchdog tick, and a cross-node heartbeat, and one of the four — the
credential directory — is destroyed by a promise that keeps running after the caller has already
returned. This doc enumerates every window where those actors can interleave badly, names the mechanism
that defends each one, and cites the spec that pins it. It is the doc to read before changing anything in
the module, and the one to re-read after.

OpenWA maintains its own catalog at `docs/31-session-lifecycle-design.md` (INV-1 through INV-10). That
document is accurate and is the upstream reference; it is written at the level of "which file defends
this". This one is written at the level of "which statement, in which order, and what breaks if you move
it" — and it covers roughly six times as many windows, because the upstream catalog documents the ten
worth naming in a design note rather than all of them.

## The five defence primitives

Everything below is built out of five mechanisms. Learning these once makes the catalog readable.

| Primitive | Where | What it establishes |
| --- | --- | --- |
| **Synchronous reservation** | `initializingSessions`, `stoppingSessions`, `stuckAuthRecoveryUsed` | A decision taken with no `await` between the check and the mutation, so no other task can interleave inside it |
| **Object identity as a generation token** | `src/engine/engine-registry.service.ts:isLive` / `deleteIfLive` | Whether the engine a callback captured is *still* the registered one. A session id is not enough: stop→start and reconnect-replace both reuse the id |
| **Bounded, isolated teardown** | `session-lifecycle-fences.ts:teardownEngineSafely` | A teardown always resolves within 10 s and never throws, and reports whether it actually completed |
| **Fail-closed settlement fence** | `session-lifecycle-fences.ts:awaitPendingTeardown` | A destructive promise that outlived its deadline race has settled — or the operation refuses rather than proceeding |
| **Ownership gate** | `src/modules/session/session-ownership.service.ts:nodeOwnsSession` | Whether this *node* may still speak for the session at all. Orthogonal to identity |

The two axes matter and are easy to conflate. `isLive` is local and asks "is this the current engine
generation". `ownsSession` is cluster-wide and asks "may this process write this row". Between a lapsed
lease and the teardown the heartbeat schedules, **the first is still true while the second is already
false** — which is exactly the window where a dying generation can park a peer's session in `FAILED`.

`isLive` / `deleteIfLive` and the `initializing` reservation ledger are documented as a mechanism in
11-engine-factory-registry.md, including the registry's own state diagram. This doc uses them; it does
not restate them.

## The four fences

`src/modules/session/session-lifecycle-fences.ts:SessionLifecycleFences` is a plain class, not a Nest
provider, constructed inside `SessionEngineLifecycle`'s constructor. The two fence `Map`s stay lifecycle
**fields handed over by reference**, so the fence unit, the lifecycle core, the controls unit, and every
spec poking the maps through the lifecycle all observe the same instances. The lifecycle keeps
same-named non-`async` delegates for the four methods its own core still calls; `destroyEngineSafely`
and `awaitInitialStatus` are reached by the controls unit directly through `this.fences`.

### Fence 1 — `teardownEngineSafely`

```
raw = teardown(engine)                     // started BEFORE the race
if label === 'logout' && sessionName:      // register the destructive promise
    trackPendingCredentialTeardown(name, raw)
await Promise.race([raw, 10s deadline])
→ true  = teardown actually completed
→ false = threw or lost the deadline; the process may still be alive
```

Three properties, each load-bearing:

1. **It always resolves.** The caller is then free to reconcile the registry and proceed with DB cleanup
   regardless of outcome. A raw `await` on a wedged Chromium would stall a stop forever.
2. **It reports completion, not attempt.** A caller with an operator-facing outcome must surface `false`
   rather than claiming a clean stop — which is why `stop` throws 502 `SESSION_STOP_INCOMPLETE` and
   `stopOrphanEngines` sorts an id into `failed` rather than `stopped`.
3. **The raw promise is registered before the race.** A teardown that loses the deadline keeps running
   past the caller's return, and for `'logout'` that leftover promise ends in an `fs.rm` of the session's
   on-disk profile. Registering `raw` — not the raced wrapper — is what makes fence 3 able to wait for it.

The 10 s deadline is uniform across all four labels (`destroy`, `disconnect`, `force-destroy`, `logout`).

### Fence 2 — `trackPendingCredentialTeardown`

Keyed by session **NAME**, not UUID. `EngineFactory`'s auth-dir helpers and both adapters'
`clearLocalAuth` build the path from `Session.name`, so the name is the credential path's key. After an
old UUID's row is deleted and the name is recreated, a late logout from the *old* UUID still targets the
*new* session's directory — same name, same path — so keying by name keeps the fence attached to the
path actually at risk.

Three subtleties:

```ts
// src/modules/session/session-lifecycle-fences.ts
const tracked = raw.catch(() => undefined);
const previous = this.pendingTeardowns.get(sessionName);
const entry: Promise<void> = previous ? Promise.allSettled([previous, tracked]).then(() => undefined) : tracked;
this.pendingTeardowns.set(sessionName, entry);
void entry.finally(() => {
  if (this.pendingTeardowns.get(sessionName) === entry) {
    this.pendingTeardowns.delete(sessionName);
  }
});
```

- **Settlement marker only** — `.catch(() => undefined)` means the entry never rejects, so it cannot
  drive a caller's deadline race to a false "completed".
- **Concurrent teardowns CHAIN** via `Promise.allSettled` instead of overwriting. Without this, a second
  logout's fast settlement would drop the entry while the first teardown's profile `rm` was still pending.
- **Removal is identity-checked**, and that is the only path that evicts an entry — so an older teardown
  settling can never drop a newer one's entry. `delete()`'s `finally` deliberately does *not* clear this
  map.

### Fence 3 — `awaitPendingTeardown` (fail-closed)

Called by `start()`, `delete()` (twice), and `executeReconnect` before anything touches the auth dir.

| Outcome | Behaviour |
| --- | --- |
| No entry for the name | no-op |
| Entry settles within 10 s | proceed |
| Still pending at 10 s | **refuse** — `ConflictException` 409 with `code: 'SESSION_NAME_TEARDOWN_PENDING'` |

Fail-closed is the whole point: a teardown still wedged past the bound could land its `rm` on credentials
a freshly (re)created session under the same name has already written. The entry is **not** dropped on
timeout, so a retry after the `rm` eventually settles will see it gone and proceed. The message is
operator-facing, retryable, and leaks no internal path.

### Fence 4 — `awaitInitialStatus` (identity-checked, warn-and-proceed)

Called by every retiring control — `stop`, `logout`, `forceKill`, `delete` — **after** the stop mark is
set and reconnect cancelled, and **before** teardown, the final `DISCONNECTED` write, or the parent-row
deletion.

It looks up `pendingInitialStatuses.get(id)` and returns immediately unless `pending.engine === engine`.
That identity check is the fence: a control action that captured engine A awaits only A's pending write,
never a replacement B's entry, and never deletes it. The wait is bounded like fence 3, but on timeout it
**warns and proceeds** rather than refusing — the INITIALIZING write is a single DB update, and a wedged
database must not block retirement indefinitely.

The guarantee: **the control action stays the final persisted owner.** A delayed `INITIALIZING` write
always settles first, so it can never land after the `DISCONNECTED` write or after the row is gone.

### `evictAndForceDestroy` — the canonical ordering

```ts
this.engines.delete(id);
void this.teardownEngineSafely(id, engine, e => e.forceDestroy(), 'force-destroy');
```

Delete first, then SIGKILL, fire-and-forget. Used by `onError` (terminal), the exhausted-reconnect path,
and the failed-re-init path. `forceDestroy()` rather than the graceful `destroy()` because such an
engine's browser or CDP connection is typically already broken, so a graceful close would only time out
before the process is reaped.

## The invariant catalog

Read as: the interleaving → the mechanism → the spec. `INV-n` cites
`docs/31-session-lifecycle-design.md`. Windows marked **W-n** are documented here and, as far as could be
determined from the source, are not enumerated upstream.

### Start and initialization

**W-1 — Double start orphans the first engine.** `INV-1`

Two `POST /start` for the same session. Both pass the `engines.has(id)` check, both construct an engine,
the registry holds the second, the first is leaked forever with no lifecycle path able to reach it.

The window is not small. `engines.has(id)` → `engines.set(id, engine)` spans the awaited `session:starting`
hook, the awaited credential fence, and the awaited `requireSession`. Defence:
`session-engine-controls.ts` reserves in `initializingSessions` **synchronously at entry — before even
`requireSession`** — and the `finally` clears it on success *and* failure so a failed start never wedges
at "already starting".

The naive fix that is wrong: checking `session.status` instead. Status is written to the DB and read back
with an `await` in between; the reservation set is the only synchronous view.

Pinned by `session.service.spec.ts` (double-start and `maxConcurrent` cases).

**W-2 — An in-flight start is invisible to the infra import pre-flight.**

Registering the reservation *after* the row read would make a start invisible during the `findOne`
round-trip, and a `stopOrphans` full-replace import could `DELETE` the session row while an engine for it
is being created. The reservation is at entry, and `EngineRegistry.activeIds()` unions `engines.keys()`
with `initializing`, so the pre-flight sees it. 66-infra-management.md consumes this.

**W-3 — The concurrency cap double-counts a starting session.**

A session mid-initialization is transiently in **both** `engines` (set at the top of `initializeEngine`)
and `initializing` (until `start()`'s `finally`), so summing the two sizes double-counts it. And `id`
itself is already reserved, so it must not count against the cap it is being checked against. Defence:

```ts
const activeIds = new Set<string>(this.engines.activeIds());
activeIds.delete(id);
if (activeIds.size >= maxConcurrentSessions) throw new BadRequestException(...);
```

**W-4 — Pre-initialize retirement.** `INV-2`

The load-bearing window of the whole module. `initializeEngine` registers the engine, then **awaits** the
`INITIALIZING` status write. A retiring control can land inside that await. Without a defence the control
tears down and writes `DISCONNECTED`, then the delayed `INITIALIZING` write settles *after* it, and the
session's last persisted status describes an engine that no longer exists.

Four mechanisms cooperate:

1. The write's promise is tracked in `pendingInitialStatuses` **carrying the exact engine object**.
2. `updateStatus` is a non-`async` delegate, so `initializeEngine` awaits the broadcaster's *own* promise
   object — the one that can be compared by identity.
3. Every retiring control calls `awaitInitialStatus(id, engine)` before its own final mutation.
4. After the await, `initializeEngine` re-validates and returns early:

```ts
if (!this.isLiveEngine(id, engine)) return;
if (this.stoppingSessions.has(id)) return;
// intentionally NO await before engine.initialize() below
```

The ordering note in the source is emphatic and worth repeating: there is **no** `await` between those
two checks and `engine.initialize()`. An intervening await would re-open the window. It is also why one
`isLiveEngine` check suffices — the two guards are separated by a synchronous `Set` lookup, so nothing
can swap the engine between them. A second, identical check used to sit after the stop mark and could
never disagree with the first.

Pinned by `session.service.spec.ts` (stop/delete-during-start teardown cases) and, in isolation, by
`session-lifecycle-fences.spec.ts`.

**W-5 — The stop mark lands after the window it guards.**

W-4's defence turns on the stop mark being visible by the time the `INITIALIZING` write settles. But
`stop()` and `delete()` in `session-engine-controls.ts` add the mark only *after* their own first await
(`requireSession` / `awaitPendingTeardown`), and `SessionService` adds an ownership `COUNT` query ahead of
those — so the mark could land after the window.

Defence: `session-engine-lifecycle.service.ts:markStopping` is public, and `SessionService.stop` /
`SessionService.delete` call it **synchronously at true entry**, with nothing awaited in between:

```ts
// src/modules/session/session.service.ts
this.engineLifecycle.markStopping(id);
try {
  if (this.ownership) await this.assertNotHeldElsewhere(id);
  await this.engineLifecycle.delete(id);
```

A mark left behind by a request that then refuses (a 409) is harmless — the next `start()` clears it.

**W-6 — A stop mark for a nonexistent id outlives the process.**

W-5's "harmless, the next `start()` clears it" holds only while a row exists. `start()` and `delete()`
clear the mark after their own `requireSession`, so for an id that never had a row **neither reclamation
path is reachable** and the entry survives for the life of the process. Defence:
`session.service.ts:discardStopMarkForMissingSession` clears it on `NotFoundException` specifically. A
404 also means there is no engine and no in-flight start for the mark to guard, so dropping it is safe as
well as necessary. A refusal against a *real* session still leaves its mark.

**W-7 — Init hangs forever.** `INV-4`

whatsapp-web.js calls `page.goto(..., { timeout: 0 })` and its web-version-cache fetch has no timeout
either, so a browser stalled under container memory pressure never rejects. Observed in production: a
session wedged in `INITIALIZING` with no error logged and `GET /qr` 400-ing forever.

Defence: `Promise.race` against `resolveEngineInitTimeoutMs()`. Only the timeout branch mutates state —
`session-engine-lifecycle.service.ts:EngineInitTimeoutError` exists purely so the two cases can be told
apart. A **real** rejection propagates untouched so `start()`'s catch keeps owning `FAILED` + reason;
pre-deleting the engine here would make `start()`'s `engines.get(id)` return `undefined`, skip its
`FAILED` write, and hide the reason.

The deadline is derived, not fixed: it must clear the auth wait the engine runs *inside* `initialize()`,
or it would SIGKILL a legitimately slow init mid-auth. See `src/engine/engine-init-timeout.ts` and
11-engine-factory-registry.md.

**W-8 — The losing side of the init race rejects with nobody listening.**

`Promise.race` cannot cancel the loser. Defence: `initPromise.catch(() => undefined)` immediately after
construction, so a late rejection is not an unhandled rejection. (The process-level handler in
04-bootstrap-and-lifecycle.md would survive it, but at ERROR level for a request that had already been
answered.)

**W-9 — The init-timeout teardown writes a redundant `DISCONNECTED`.**

On this path the engine is evicted from the map **before** teardown. The reason is specific:
`forceDestroy()` → `beginClientTeardown` → `setStatus` fires `onStateChanged` **synchronously** while the
engine is still live, so `isLiveEngine` would pass and the callback would run a redundant status write
against this path. Unlike `delete`/`stop`/`forceKill`, this path has no `stoppingSessions` +
`cancelReconnect` wrap to fall back on.

**The source carries an explicit do-not-port note, and it is correct:** in `delete`/`stop`/`forceKill`,
`engines.has(id)` staying **true** for the duration of the teardown await is the sole deterministic block
on a concurrent `start()` — because `start()` *clears* `stoppingSessions` rather than rejecting on it. So
delete-first there would open a start-during-teardown orphan window. Two opposite orderings, both
deliberate. This is the single easiest thing to "clean up" and break.

**W-10 — A reconnect timer fires during a start's awaited I/O.**

A prior failed `executeReconnect` can leave a timer pending. If it fires during `start()`'s awaited hook
or engine init, it destroys or replaces the engine this start is creating, or orphans the Chromium.
Defence: `cancelReconnect(id)` is called **before** the awaited `session:starting` hook, not after.
Idempotent, so it is a no-op on the common fresh-start path.

**W-11 — A rejected init leaves a half-built engine holding a slot.**

`initializeEngine` registers the engine *before* `initialize()` runs, so a rejection leaves it in the
map. Left there, it holds a concurrency slot forever and the next `start()` rejects the session as
"already started". Defence: `start()`'s catch evicts and `forceDestroy()`s — explicitly not `destroy()`,
because `initialize()` failing usually means the browser/CDP connection is already broken (a "Target
closed" crash mid-injection), so a graceful destroy has nothing live to talk to and can only time out,
after which the orphaned process is never actually killed. It also drops the reconnect state this start
armed up front, because nothing will ever fire it.

**W-12 — A delete racing a slow start leaves live credentials on disk.** `INV-5`

`delete()` purges the auth dirs and removes the row. An in-flight `start()` (or `executeReconnect`) whose
`initialize()` lands between the eviction and the row removal **re-creates** the auth dir — both engines
`mkdir` at init. The post-init guard tears the engine down, but **engine teardown never touches the
on-disk dirs**, so without a second purge the race leaves live WhatsApp credentials behind, and a later
same-name recreate would silently re-link them.

Defence: `session-engine-lifecycle.service.ts:purgeAuthDirsIfDeleted`, gated **twice**:

```ts
if ((await this.sessionRepository.findOne({ where: { id } })) != null) return;   // a stop(), not a delete
if ((await this.sessionRepository.findOne({ where: { name } })) != null) return; // recreated under the same name
await this.engineFactory.purgeSessionData(name);
```

Both gates are necessary. A `stop()` retirement still has its row and its credentials must survive; a row
re-created under the same name now *owns* those dirs, so purging would wipe the fresh session's link.
Best-effort: a failure is logged, never thrown, so the retirement path still surfaces the deleted session
as `NotFound`.

**W-13 — The stop mark cannot catch a delete that raced a start.**

`delete()` clears its `stoppingSessions` mark in its `finally` — milliseconds — and removes the row well
before a Chromium launch resolves. So the mark alone can't detect it. Defence:
`session-engine-lifecycle.service.ts:isSessionRetired` checks the mark **and** falls through to a row
read, making the row the source of truth a post-init guard re-checks.

### Logout, delete, and the credential path

**W-14 — Logout's `fs.rm` lands on a fresh profile.** `INV-8`

The most-defended window in the module, with a 475-line dedicated spec. `client.logout()` chains
`authStrategy.logout()` → `fs.rm(userDataDir)`. Two problems: the Chromium process may still hold file
handles, and the `rm` may outlive the deadline race and land on a directory a *later* `start()` under the
same name has already populated.

Defence chain: `teardownEngineSafely` registers the raw promise (fence 2) → `start()`, `delete()`, and
`executeReconnect` all call `awaitPendingTeardown(session.name)` (fence 3) before touching disk →
fail-closed 409 if still wedged.

Pinned by `logout-teardown-race.spec.ts` across eleven interleavings, including
`'old-name teardown still pending past 10s: start rejects 409 and does not create the engine'` and
`'map assertions use the session name, not the UUID'`.

**W-15 — Two concurrent logouts for one name.**

The second's fast settlement drops the entry while the first's profile `rm` is still pending, and a
`start()` then sails through the fence. Defence: chaining via `Promise.allSettled` (fence 2). Pinned by
`'two concurrent logouts for the same name keep the fence until BOTH settle'`.

**W-16 — An older teardown's settlement evicts a newer entry.**

Defence: identity-checked removal (fence 2). Pinned by
`'after the raw teardown resolves, retry start succeeds and the entry self-removes'`.

**W-17 — A logout slips between delete's fence #1 and its engine eviction.**

`delete()` needs **two** fences, and the reason is precise. Fence #1 fails fast on an
*already-pending* teardown before any lifecycle mutation. But a logout that starts *after* fence #1 and
captures the engine *before* eviction registers its destructive promise synchronously — via the engine's
`onCredentialTeardownStarted` callback — so fence #2, placed immediately after the eviction and **before**
the `session:deleted` hook and the DB transaction, observes it and refuses. After eviction a *new* logout
cannot create a destructive promise (no live engine); one that already captured the engine is caught here.

This is why `onCredentialTeardownStarted` is one of the five **ungated** callbacks in
`session-engine-event-wiring.ts:buildCallbacks`. A logout that captured this engine must register its
promise *even as* a concurrent stop or delete evicts it, because the `rm` targets the *name's* directory
regardless of which engine generation is current.

Pinned by `'a logout starting after delete first fence but before engine eviction is caught by the second fence'`.

**W-18 — A fence #2 refusal leaves a lying status.**

Unlike fence #1, a refusal at fence #2 leaves the row behind with its engine **already destroyed**, so
the persisted status keeps reading `READY` (or whatever it was) for a session that can no longer answer
anything. Defence: reconcile to `DISCONNECTED` before propagating the 409 — and best-effort
(`.catch(() => undefined)`), so a failed status write cannot mask the 409 the caller has to act on. Fence
#1 needs none of this, because nothing has run there yet and its status is still accurate.

**W-19 — A refused delete drops the fence it was refused by.**

`delete()`'s `finally` deliberately does **not** clear `pendingTeardowns`. The name is still reserved
against the live remover. Pinned by `'a refused delete does NOT drop the pending fence'`.

**W-20 — A 409 leaves partial lifecycle mutation behind.**

`start()`'s fence sits *immediately* after the read-only checks and *before* any mutation — stop-mark
clear, hook, reconnect state, engine creation, recovery-budget reset. On a 409, none of it ran: `start()`
simply did not happen. The one transient exception is the `initializingSessions` reservation, which its
`finally` removes. `delete()` is the same: on a fence #1 409, no stop mark, no reconnect cancel, no
teardown, no state cleanup. Pinned by
`'on a first-fence 409, start does not touch reconnect timer / engine / last status / error / recovery state'`.

**W-21 — A row delete/recreate under the same name poisons the fence key.**

`session.name` is captured as an **immutable snapshot** at `initializeEngine` entry and handed to
`buildCallbacks`, so `onCredentialTeardownStarted` keys on the name the engine was actually built with.

**W-22 — In-memory maps grow without bound across create/fail/delete churn.**

`delete()` guards cleanup on a `parentDeleted` flag set only after the transaction removes the parent row,
then clears five things: `lastDispatchedStatus`, `sessionErrors`, `sessionRestrictions`, `presence`,
`stuckAuthRecoveryUsed`. A 409 leaves them intact because the session still exists. Each is keyed by a
UUID that can never be read again, and the restriction entry additionally feeds a gauge that must not
keep counting an account whose session is gone.

**W-23 — Concurrent same-name create.**

`create()`'s `findOne` pre-check is a check-then-insert TOCTOU: two concurrent creates both pass it, then
one hits the `name` UNIQUE constraint. Defence: `src/common/utils/db-errors.ts:isUniqueViolation`
translates it to the same 409 the pre-check would have produced, rather than leaking a raw 500.

### Reconnect

**W-24 — Two disconnects stack two timers.**

Two back-to-back disconnects would arm two timers, run `executeReconnect` twice, and double-init the
engine. Defence: `scheduleReconnect` clears any pending timer before setting the new one.

**W-25 — A reconnect resurrects a session that is being torn down.**

`executeReconnect` awaits engine init, so a stop or delete during that window could re-register an engine
*after* teardown. Defence: `stoppingSessions` checked at `executeReconnect` entry **and** re-checked after
the init via `isSessionRetired` (W-13), with the just-created engine torn down and the dirs re-purged if
retired.

**W-26 — A relaunch collides with a wedged orphan on the same profile dir.**

A timed-out `destroy()` leaves the Chromium alive — the raced promise never kills it — and
`executeReconnect` relaunches on the **same profile dir in the same tick**. Defence: escalate to
`forceDestroy()` when `destroyed === false`, bounded again by `teardownEngineSafely` so it cannot wedge
twice. Then `deleteIfLive(id, oldEngine)`, never a bare `delete(id)`.

**W-27 — A transient DB read misclassifies a healthy engine as half-built.**

`executeReconnect`'s post-init retirement check is a DB read. If it threw, control would fall into the
outer `catch`, which force-kills what it assumes is a half-built engine — destroying the session that was
just successfully recovered. Defence: an inner `try/catch` that assumes `retired = false` on a read error.

**W-28 — A rejected re-init strands an orphan.**

Same shape as W-11 but on the reconnect path: `evictAndForceDestroy(id, halfBuilt)` before scheduling the
next attempt.

**W-29 — An exhausted chain leaves a dead engine in the map.**

The terminal path mirrors `onError`: evict and force-destroy the dead engine (guarded on presence, since
the `executeReconnect`-catch path may already have evicted it), because leaving it holds a concurrency
slot and makes the next `start()` reject the session as "already started".

**W-30 — Stale reconnect state pins a claim to a dead node.**

The terminal path also calls `cancelReconnect(id)`. A leftover entry would keep
`session-engine-lifecycle.service.ts:isEngineActive` returning true, so the ownership heartbeat would
renew the claim on a session with **no engine** — pinning it to this node forever: unstartable on any
peer and invisible to the takeover sweep, which only sees lapsed leases.

`isEngineActive` itself encodes a matching distinction:

```ts
if (this.engines.has(id) || this.initializingSessions.has(id)) return true;
const reconnect = this.reconnectStates.get(id);
return reconnect != null && (reconnect.timer !== null || reconnect.attempts > 0);
```

The entry `start()` creates up front — `{attempts: 0, timer: null}` — is **dormant**. A start that then
failed leaves nothing that will ever re-register an engine, and treating that as liveness would pin the
claim. Only an armed timer or a spent attempt counts.

**W-31 — A mid-shutdown disconnect launches a fresh Chromium racing the drain.**

Defence in three places, all reading the same source: `scheduleReconnect` returns early on
`shutdownService.isShuttingDown()`, `session-liveness-watchdog.service.ts:tick` does the same, and
`session-takeover.service.ts` consults it through its `stopping` getter. Leaving the session
`DISCONNECTED` is the correct end state.

**W-32 — A poisoned `config` value drives a relaunch storm or an unbounded loop.**

`resolveReconnectConfig` coerces and clamps because an operator-supplied value feeds `setTimeout` and a
terminal comparison. Non-numeric → `NaN` delay (`setTimeout` fires at 0) and `attempts >= NaN` always
false. `clampReconnectDelay` additionally bounds the computed delay to `[0, 3600000]` so a large
exponent cannot overflow `setTimeout`'s 32-bit ms field and fire immediately. `INV-9`; pinned by
`reconnect-policy.spec.ts` and `reconnect-config.spec.ts`. Full treatment in
22-session-reconnect-and-liveness.md.

### Engine callbacks and stale generations

**W-33 — A superseded engine's callback mutates the current session.** `INV-3`

Each of the 17 callbacks closes over its own engine instance. Once the session is stopped (engine
removed) or restarted/reconnected (engine replaced), a late callback from the superseded engine must not
touch the session that now belongs to a different — or no — engine. Defence: `engines.isLive(id, engine)`
at each gated callback's entry. Identity closes both the post-stop window and the stale-generation
window; a bare `has()` closes neither.

**W-34 — A superseded engine's teardown evicts its live replacement.** `INV-3`

Defence: `deleteIfLive` everywhere, never `delete(id)`, on every path that tears down an engine it
captured earlier. Documented as a mechanism in 11-engine-factory-registry.md and pinned by
`src/engine/engine-registry.service.spec.ts`.

**W-35 — `handleEngineDisconnected` awaits a DB read in the middle of its own side effects.**

The most heavily fenced single method after `initializeEngine`. It has **four** identity checks, and each
one guards a distinct boundary:

| Position | Guards |
| --- | --- |
| Entry | The gap between the caller's own check and this call site — enough for a stop or reconnect to swap the engine |
| After `findOne` | The `await` yield itself. Only a still-live owner may publish side effects or change the persisted status — otherwise a stale disconnect clobbers a replacement that is already `READY` |
| Before the terminal-unlink `phone` clear | Ownership, not identity — see W-38 |
| Before `scheduleReconnect` | The timer will later `engines.get(id)` and destroy **whatever engine currently owns the id**. If this engine was superseded, that timer would destroy the replacement |

The comment on the fourth is honest about why it exists even though no `await` sits between the third and
it today: it is the load-bearing boundary for the reconnect, and object identity is the exact generation
token. The row is also re-read here rather than trusting a caller-held snapshot, because the watchdog
detects death long after the last state change and even the callback's closure snapshot can be stale.

**W-36 — The stuck-auth recovery budget resets every generation.**

`recoverFromStuckAuth` — a generation that authenticated but never reached readiness — wipes `LocalAuth`.
Automatic reconnects build a **fresh adapter**, so an instance-local budget would reset every generation
and wipe credentials forever: the QR → timeout → clear loop. Defence: the budget is hoisted out of the
adapter into `stuckAuthRecoveryUsed`, keyed by session id, so it survives across reconnect generations
within one episode. The claim is **synchronous** with two guards in order:

```ts
if (!this.isLiveEngine(id, engine)) return false;   // a stale generation must not spend the current owner's budget
if (this.stuckAuthRecoveryUsed.has(id)) return false; // one claim per episode
this.stuckAuthRecoveryUsed.add(id);
return true;
```

Synchronous on purpose: the race between the stuck-auth timeout and a concurrent start or reconnect is
decided within a single event-loop turn, with no `await` between the checks and the mutation. A denial
makes the adapter fail terminally **without touching the auth dir**.

The re-arm points are deliberately narrow and enumerated in the source: an **accepted** top-level
`start()` (after the duplicate/cap/name-fence checks pass), `onReady` (recovery proved successful), and a
**committed** delete. Not on a rejected start, not on `executeReconnect`, not on a disconnect, QR, auth
failure, or engine replacement.

**W-37 — One transition emits twice.**

Some engines signal one transition via **both** `onStateChanged` and a dedicated callback
(`onQRCode` / `onDisconnected`). Defence: `session-status-broadcaster.ts:lastDispatchedStatus` guards the
WS emit *and* the webhook POST — the DB write is unconditional, only the fan-out is de-duped. Cleared on
a committed delete. Pinned by `session-status-broadcaster.spec.ts`.

**W-38 — A dying generation parks a peer's session in an unrecoverable status.**

The ownership axis. A lease can lapse while the process is perfectly healthy — a slow query is enough.
The heartbeat notices at its next tick and tears the local engine down, but until that finishes
`isLiveEngine` is still **true**, so the dying generation can persist a status onto a row a peer now
owns. `FAILED` is the expensive one: excluded from the boot reset **and** the takeover sweep, so a
session pushed into it leaves every automatic recovery path on every node until a human acts.

The scope is stated plainly in `session-engine-lifecycle.service.ts:ownsSession`, and it is a narrowing,
not a closure:

| Fenced | Not fenced |
| --- | --- |
| the three status writes in the event wiring (`persistStatus`) | `handleEngineReady`'s direct row write |
| the exhausted-reconnect `FAILED` | `handleEngineDisconnected`'s `DISCONNECTED` |
| the start-path `FAILED` in controls | |
| the terminal-unlink `phone` clear | |

The rule behind the split: a wrong `READY` or `DISCONNECTED` **self-heals**, because both are in the boot
reset's `activeStatuses` *and* in `TAKEOVER_STATUSES`. A wrong `FAILED` or a wrongly nulled `phone` does
not heal until the owner's next `READY`. The gate is also a point-in-time read — `owned` can change while
the awaited write is in flight — so this narrows the window rather than closing it, and the source says so.

`session-ownership.service.ts:nodeOwnsSession` centralises the no-ownership default at **TRUE**, and the
comment is careful about why: `SessionOwnershipService` is an unconditional `SessionModule` provider, so a
running gateway *always* has one and the fence is live single-node too. The TRUE default therefore serves
direct-construction specs, not production. Inverting it would silence every engine-driven status write
everywhere instead of fencing a few. Pinned by `session-ownership-status-fence.spec.ts`, including
`'is TRUE when no ownership service is wired'` — a test that exists specifically to pin the default.

**W-39 — `owns()` cannot be async.**

Its callers are engine callbacks on the hot path. An extra suspension point there would re-open the very
retirement race the surrounding `isLiveEngine` fence closes. So `owns()` is a synchronous in-memory `Set`
lookup — which is also the *right* authority, because that set is what `renew()` clears the moment it
observes the claim is gone.

### Claim, release, and the heartbeat

**W-40 — Both processes claim the same free session.**

Defence: the claim is a **conditional UPDATE** on the same predicate the read used, so the second
process's UPDATE matches no row. Deciding on the read alone would let both pass.

**W-41 — The lease predicate silently never matches.**

`session-ownership.service.ts:leaseParam` exists because raw SQL bypasses the column's transformer and
the stored form is not a `Date` on every dialect — SQLite keeps an ISO string. An untransformed parameter
compares against the wrong representation and the clause **silently never matches**, so an expired claim
would never be taken over and every session a crashed process held would be stranded forever. A bug with
no error message.

**W-42 — A failed or refused start pins the claim.**

The heartbeat would renew it and the session could never be started anywhere else. Defence:
`session.service.ts:releaseUnlessEngineActive` on every failure path.

**W-43 — Releasing under an in-flight start unclaims a live engine.**

`releaseUnlessEngineActive` is gated on `isEngineActive`, and this applies on the **success** path of
`stop()` too: a `start()` that began before this stop and is still mid-launch owns the claim now, so a
blanket release would leave a live engine on an unclaimed row that no heartbeat renews and any peer may
start a second time. An "already starting/started" refusal likewise means this node genuinely runs the
engine.

**W-44 — A blanket release on `stop()`'s error path deletes a peer's claim.**

`stop()`'s catch deliberately has **no** release, unlike `logout()`'s and `forceKill()`'s, because it also
carries the foreign-node 409 where the claim is the peer's. The local-502 path keeps the claim, and since
only claims with a live engine are renewed, it lapses at TTL instead of pinning the session.

**W-45 — A heartbeat tick inside an import's transaction concludes total loss.**

The subtlest window in the ownership service. On SQLite every TypeORM query runner shares **one
connection**, so a heartbeat tick can execute *inside* a replace-all import's open transaction — after
its `DELETE`, before its re-inserts commit — and see **no rows at all**. Concluding loss there tears down
engines that never stopped, and does so even when the import later rolls back and every row comes
straight back.

Defence: `session-ownership.service.ts:suspendLossDetection` returns a **release function** rather than
exposing a `resume()`, so the count cannot be unbalanced by a caller that forgets which spans it opened,
and releasing the same token twice is a no-op. It is a counter, not a flag, so overlapping spans cannot
resume each other early. And it is re-checked **after** the queries, not only at entry — the tick this
protects against is precisely one that was already in flight when the import took the token.

**W-46 — A DB hiccup reads as lost leases.**

`renew()`'s `catch` returns without concluding anything. Reading loss from a failed query would tear down
every healthy engine on the node the first time the database blipped, which is far worse than a late
renewal. The TTL is deliberately 3× the heartbeat so a single missed tick is absorbed.

**W-47 — A throwing lease-loss handler stops the heartbeat.**

`renew()` is driven by an interval, so a throwing handler would surface as an unhandled rejection and
could stop the loop entirely. Defence: `try/catch` with an ERROR log. The ids are already out of `owned`,
so the bookkeeping stays consistent either way.

**W-48 — Renewing a claim whose engine is gone.**

Defence: the `engineLiveness` probe filters `held` down to `live` before the UPDATE. The id stays in
`owned` so the loss is still *noticed* once a peer actually takes the row — the filter suppresses
renewal, not detection.

**W-49 — A deliberate stop leaves an adoptable orphan.**

`release()` clears a **lapsed foreign** claim too, on the same predicate `claim()` uses. A stop of a
session whose crashed owner's lease expired must actually leave it down: a row still naming the dead node
reads as an abandoned orphan to the takeover sweep, which would adopt and restart the session the
operator just stopped. A **live** foreign claim is left alone — releasing that would strand a peer's
running engine.

### Takeover and request routing

**W-50 — Lease loss writes the peer's row.** `INV-6`

Defence: the loss handler calls `stopOrphanEngines`, which tears down locally and leaves the row alone,
because the row is no longer ours to write. Pinned by `src/modules/takeover/session-takeover.service.spec.ts`
and `session-ownership.service.spec.ts`.

**W-51 — Takeover hides an operator-visible failure.** `INV-7`

`TAKEOVER_STATUSES` omits `FAILED` (a human decides) and `QR_READY` (an unpaired session on a dead node
has nothing to resume — restarting it elsewhere renders a QR nobody asked for). Eligibility also requires
a non-null `phone`.

**W-52 — A sweep mid-flight during a rolling restart registers an engine after teardown.**

Clearing the interval stops the *next* sweep; it does nothing about one already running, which is neither
aborted nor awaited. Without a signal, a tick could construct and register an engine **after** the
shutdown path emptied the registry — nothing would tear it down — and claim a lease for a process about
to exit, pinning the session to a dead node until the lease lapsed. Defence: the `stopping` getter unions
`shuttingDown` (set by `onModuleDestroy`) with `shutdownService.isShuttingDown()` (the earlier drain
signal), and it is re-checked **per iteration**, because each adoption costs a browser launch plus a 2 s
stagger and the loop spans a large part of the sweep interval.

**W-53 — Sweeps stack behind a slow Chromium launch.** Defence: `sweepInFlight`.

**W-54 — The forwarder becomes an SSRF gadget.**

`session-proxy.interceptor.ts:forwardTarget` is the one place in this band where a fence protects against
an attacker rather than a schedule. HTTP/1.1 allows the absolute request form
(`GET http://elsewhere/api/sessions/x HTTP/1.1`), Express matches the route for it, and `req.originalUrl`
then holds that absolute URI — where `new URL(originalUrl, base)` **discards the base entirely**. An
authenticated caller could aim this node's forwarder at any origin and receive the response *with the
credentials of the call attached*: server-side request forgery that also exfiltrates the API key.

Defence: rebuild from the owner's origin so it is structurally un-influenceable rather than merely
validated — and do it through the URL **setters**:

```ts
const base = new URL(ownerNodeUrl);
const requested = new URL(originalUrl, base);
const target = new URL(base.toString());
target.pathname = requested.pathname;
target.search = requested.search;
```

**W-55 — A `//` pathname re-parses as an authority.**

`new URL('//elsewhere/x', base)` resolves its authority *from the path* — a network-path reference — and
would re-open W-54. Assigning `target.pathname` on a clone never reinterprets the value as an authority.
The source is explicit that routing cannot currently deliver such a target (Express does not match a
session route whose path starts with `//`), but the origin must be un-influenceable **by construction,
not by the router's normalization holding**.

**W-56 — A forged hop marker makes a request execute on the wrong node.**

`FORWARDED_HEADER` is client-settable, so it is verified rather than trusted: a marked request that still
lands on a live non-owner — forged, or ownership moved mid-flight — is refused with a retryable 409
instead of executed here. Without that, a `stop()` on this node would write `DISCONNECTED` while the
owner's engine stays up.

**W-57 — Every successful forward is logged as an error.**

Nest resolves an interceptor's observable with `lastValueFrom`, which **rejects on an empty one**
(`EmptyError`). Completing empty after writing the response meant every successful forward travelled the
unknown-exception path and logged an ERROR stack for a request that had in fact succeeded. Defence:
`return of(undefined)`. Verified end-to-end in the session-proxy e2e spec.

### Projection

These belong to `MessageProjector` and are covered in depth in 27-message-projection.md; they are listed
here so the catalog is complete.

**W-58 — A late hook continuation persists an orphan row.** The `message:received` hook chain is async
and a delete can retire the engine while it awaits. The `messages` table carries a plain `sessionId` with
**no FK**, so a session-delete cleanup would never reap the row. Defence: re-check `engines.isLive` after
the hook, before the insert, mirroring the synchronous gate at entry.

**W-59 — An engine re-fires `message` for one inbound message.** Defence:
`UNIQUE(sessionId, waMessageId)` makes the `insert()` — deliberately not `save()` — the atomic dedup
oracle. Fail-open on a *non*-conflict error, so a real message is never dropped by a transient DB fault.

**W-60 — An ack arrives before the send's second save commits.** The UPDATE matches 0 rows, and each ack
is one-shot. Defence: one retry after `message-projector.service.ts:ACK_RECONCILE_DELAY_MS`, with the
forward-only `In(...)` status guard keeping it idempotent.

**W-61 — A reaction's read-modify-write clobbers a concurrent ack.** The per-message mutation queue
serializes reaction-vs-reaction but **not** reaction-vs-ack. Defence: a scoped update of *only* the
`metadata` column, never `save(msg)`, which would re-persist the `status` read at `findOne` time.

**W-62 — A history insert collides with a live insert.** Between the dedup `SELECT` and the write.
Defence: `orIgnore()`, so the collision is skipped rather than aborting the whole batch.

**W-63 — `findOne` with an undefined condition matches an arbitrary row.** TypeORM **drops** an
undefined condition from the where-clause rather than matching nothing, so an unresolvable reacted-message
id would silently clobber and emit *some other* row's reactions. `!msg` is no protection — the row found
is real, just wrong. Defence: guard `event.messageId` before the lookup.

**W-64 — A stale probe result touches a restarted session.** Defence: `engines.isLive` after the
watchdog's probe race, mirroring the callback gate.

**W-65 — An observe-only failure counter is inherited by a READY stretch.** A session in
`ACTION_REQUIRED` accrues probe failures without acting. Defence: every path out of `ACTION_REQUIRED`
passes through a status that hits the `failures.delete(id)` branch (or through `onReady`, which clears
it), so an observe-only count can never push a fresh READY stretch over `SESSION_WATCHDOG_MAX_FAILURES`
early.

## File Inventory

The files that carry a fence. The full 57-file map of `src/modules/session/` is in
20-session-lifecycle.md; this table is the subset a change to any invariant above must touch. Line
counts as measured.

| Path | Lines | Fences it carries |
| --- | --- | --- |
| `src/modules/session/session-lifecycle-fences.ts` | 198 | All four fences plus `evictAndForceDestroy` |
| `src/modules/session/session-engine-controls.ts` | 662 | Synchronous reservation, cap accounting, both delete fences, post-init retirement guards, teardown escalation |
| `src/modules/session/session-engine-lifecycle.service.ts` | 1103 | `markStopping` / `clearStopping`, `pendingInitialStatuses`, the init deadline, `isSessionRetired`, `purgeAuthDirsIfDeleted`, `isEngineActive`, `ownsSession`, the reconnect terminal path, the stuck-auth claim |
| `src/modules/session/session-engine-event-wiring.ts` | 399 | Per-callback liveness gating, the five deliberate exemptions, `persistStatus`'s ownership gate |
| `src/modules/session/session.service.ts` | 821 | Entry-time stop mark, `discardStopMarkForMissingSession`, `assertNotHeldElsewhere`, `releaseUnlessEngineActive`, transient-retry re-claim, claimable-scoped boot reset |
| `src/modules/session/session-status-broadcaster.ts` | 62 | `lastDispatchedStatus` fan-out de-dup |
| `src/modules/session/session-ownership.service.ts` | 392 | Conditional-UPDATE claim, `leaseParam`, `suspendLossDetection`, `engineLiveness` filter, renew error isolation, `nodeOwnsSession` |
| `src/modules/session/session-proxy.interceptor.ts` | 239 | `forwardTarget`, hop-marker verification, non-empty observable |
| `src/modules/takeover/session-takeover.service.ts` | 152 | `stopping` re-check per iteration, `sweepInFlight`, `TAKEOVER_STATUSES` |
| `src/modules/session/reconnect-policy.ts` | 124 | Clamps and the stability reset |
| `src/modules/session/session-liveness-watchdog.service.ts` | 190 | Post-probe liveness re-check, observe-only counter hygiene, shutdown gate |
| `src/modules/session/message-projector.service.ts` | 627 | Post-hook liveness re-check, insert-as-dedup-oracle, ack retry |
| `src/modules/session/message-mutation-projector.ts` | 129 | Per-message mutation queue, metadata-scoped update, `messageId` guard |
| `src/modules/session/message-history-projector.ts` | 97 | `orIgnore()` on the backfill insert |
| `src/engine/engine-registry.service.ts` | — | `isLive` / `deleteIfLive` / `initializing` — see 11-engine-factory-registry.md |

Specs that pin them:

| Path | Lines | Coverage |
| --- | --- | --- |
| `src/modules/session/logout-teardown-race.spec.ts` | 475 | W-14 through W-21 — eleven interleavings of the credential path |
| `src/modules/session/session-lifecycle-fences.spec.ts` | 174 | All four fences in isolation, incl. the identity check on `awaitInitialStatus` |
| `src/modules/session/session.service.spec.ts` | 6341 | W-1 through W-13, W-24 through W-32, W-36 |
| `src/modules/session/session-ownership.service.spec.ts` | 525 | W-40 through W-49 |
| `src/modules/session/session-ownership-status-fence.spec.ts` | 149 | W-38, W-39, and `nodeOwnsSession`'s TRUE default |
| `src/modules/session/session-proxy.interceptor.spec.ts` | 360 | W-54 through W-57 |
| `src/modules/takeover/session-takeover.service.spec.ts` | 251 | W-50 through W-53 |
| `src/modules/session/session-liveness-watchdog.service.spec.ts` | 292 | W-64, W-65 |
| `src/modules/session/message-projector.service.spec.ts` | 514 | W-58 through W-63 |
| `src/modules/session/reconnect-policy.spec.ts` | 203 | W-32 |
| `src/engine/engine-registry.service.spec.ts` | — | W-33, W-34 |

## Fence coverage map

Which fence defends which windows, so a change to one fence has a re-read list.

| Fence / primitive | Defends |
| --- | --- |
| `initializingSessions` synchronous reservation | W-1, W-2, W-3 |
| `stoppingSessions` + `markStopping` / `clearStopping` | W-4, W-5, W-6, W-25, W-52 |
| `pendingInitialStatuses` + `awaitInitialStatus` | W-4 |
| `isLiveEngine` | W-4, W-33, W-35, W-36, W-58, W-64 |
| `deleteIfLive` | W-26, W-34 |
| `teardownEngineSafely` | W-11, W-26, W-29, W-31 |
| `pendingTeardowns` + `awaitPendingTeardown` | W-14, W-15, W-16, W-17, W-19, W-20 |
| `isSessionRetired` + `purgeAuthDirsIfDeleted` | W-12, W-13, W-25 |
| `ownsSession` / `nodeOwnsSession` | W-38, W-39 |
| Conditional-UPDATE claim + `leaseParam` | W-40, W-41, W-49 |
| `releaseUnlessEngineActive` + `isEngineActive` | W-30, W-42, W-43, W-44, W-48 |
| `suspendLossDetection` | W-45 |
| `forwardTarget` + `FORWARDED_HEADER` | W-54, W-55, W-56 |
| `UNIQUE(sessionId, waMessageId)` | W-59, W-62 |

## Ordering rules that must not be "simplified"

Collected because each one looks like dead weight in isolation, and each one has a failure behind it.

| Rule | Breaks if reordered |
| --- | --- |
| Reserve `initializingSessions` **before** `requireSession` | W-1, W-2 |
| `markStopping` **before** the ownership fence's awaited query | W-5 |
| No `await` between the post-INITIALIZING re-checks and `engine.initialize()` | W-4 |
| `awaitPendingTeardown` **before** `engineFactory.create` | W-14 |
| Delete's fence #2 **after** eviction, **before** hook and transaction | W-17 |
| `cancelReconnect` **before** the awaited `session:starting` hook | W-10 |
| `awaitInitialStatus` **before** teardown / final write / row removal | W-4 |
| Evict **before** teardown on the init-timeout path **only** | W-9 |
| Keep `engines.has(id)` true through teardown in stop/logout/forceKill/delete | W-9 |
| `ownership.releaseAll()` **after** `engineLifecycle.shutdown()` | a peer claims a session still being held open |
| Cancel reconnect timers **before** destroying engines in `shutdown()` | a timer reschedules mid-teardown |
| Dispatch `call.received` **before** the auto-reject attempt | a reject failure eats the event |
| `suspendLossDetection` re-checked **after** the renew queries | W-45 |

## Failure Modes & Edge Cases

| Scenario | Behaviour | Pinned by |
| --- | --- | --- |
| Credential teardown wedged past 10 s | Retryable 409 `SESSION_NAME_TEARDOWN_PENDING`; entry retained | `session-lifecycle-fences.spec.ts`, `logout-teardown-race.spec.ts` |
| `INITIALIZING` write wedged past 10 s | WARN `pending_initial_status_wait_exhausted`, retirement proceeds | `session-lifecycle-fences.spec.ts` |
| Teardown throws | `teardownEngineSafely` resolves `false`; caller reconciles anyway | `session-lifecycle-fences.spec.ts` |
| Stale generation claims the stuck-auth budget | Denied on the identity guard; adapter fails without touching the auth dir | `session.service.spec.ts` |
| Lease lapses mid-`start()` | Start-path `FAILED` suppressed; local `lastError` still recorded | `session-ownership-status-fence.spec.ts` |
| Import transaction empties `sessions` on SQLite | Loss detection suspended; no engine torn down | `session-ownership.service.spec.ts` |
| Absolute-form request target | Origin rebuilt from the owner's `nodeUrl` | `session-proxy.interceptor.spec.ts` |
| Forged `x-openwa-forwarded` on a non-owner | Retryable 409 | `session-proxy.interceptor.spec.ts` |
| Owner unreachable | 503 naming the node and its `NODE_URL` | `session-proxy.interceptor.spec.ts` |

## Jarcube Portability

**Classification:** ENGINE-COUPLED

**Rationale:** The *windows* are engine-coupled — they exist because an engine is a process with a
credential directory. The *discipline* is not, and it is the single most valuable thing in this doc set
to carry across. Jarcube has no engine to orphan, but it does have long-lived per-tenant objects
(`QuantumMind-backend/src/socket/socket-state.service.ts`), async handler chains
(`QuantumMind-backend/src/message-handler/message-handler.service.ts`), and multi-step operations over a
row plus an in-memory cache plus an external API — which is the same shape with different nouns.

**Prerequisites:** 11-engine-factory-registry.md's `isLive` / `deleteIfLive` pattern, which is the one
concrete primitive worth copying verbatim.

**Cloud API caveats:** most windows simply cannot occur. There is no credential directory, so W-14
through W-21 vanish. There is no engine process, so W-7 through W-13, W-26 and W-29 vanish. There is no
QR, so W-51's `QR_READY` exclusion is meaningless. Do not port the fences; port the four habits below.

**Specific recommendations for Jarcube:**

- **Identity, not presence, for anything cached per tenant.** If Jarcube caches a client, socket, or
  token per bot and can ever replace it, every callback that captured the old one must compare by object
  identity before mutating shared state. This is W-33/W-34, it is the most repeated invariant in
  OpenWA's session module, and it is transport-independent. `isLive` / `deleteIfLive` are eight lines.
- **Synchronous reservation before the first `await`.** Any "is this already in progress" check whose
  answer is read from the database is a TOCTOU. W-1's lesson — the reservation set is the only
  synchronous view — applies to any per-tenant async operation Jarcube serializes, including
  webhook-triggered work in `message-handler.service.ts`.
- **Re-check liveness after every `await` in a handler chain.** W-58 is the port-relevant one: Jarcube's
  message handler awaits AI calls and template lookups, and a bot deleted mid-chain should not get a row
  written for it afterwards.
- **Fail closed on a destructive fence, and do not drop the entry on timeout.** W-14's shape generalises
  to any "a destructive async operation may still be running" situation — a file delete, an S3 purge, a
  token revocation. Refusing with a retryable 409 that keeps the reservation is strictly better than
  proceeding and hoping.
- **Copy the lease pattern only if Jarcube ever runs multiple writers per bot.** It is designed for
  exactly that and is covered in 23-session-ownership-and-takeover.md, but a single-writer deployment
  gains nothing from it.
- **Do port `forwardTarget`'s reasoning if Jarcube ever proxies.** The absolute-form request target is a
  general Express hazard, not a WhatsApp one, and the "un-influenceable by construction, not by
  validation" framing is the correct one for any origin rebuild.

## Open Questions

Two places where the source is candid that a window is narrowed rather than closed, and one where the
coverage looks thinner than the surrounding discipline.

- **`ownsSession` is a point-in-time read (W-38).** The source states it: `owned` can change while the
  awaited write is in flight. Closing it would need the status write itself to be conditional on
  `nodeId = :me` — a `WHERE` clause on the UPDATE rather than a pre-check. Whether that was considered
  and rejected (it would change the affected-rows semantics several callers ignore) could not be
  determined from the code. **This is the least-defended invariant in the band relative to its cost:**
  the whole reason `FAILED` is fenced is that nothing resets it automatically, and the fence is a
  read-then-write.
- **`handleEngineReady`'s row write is unfenced by design (W-38).** The justification — a wrong `READY`
  self-heals via the boot reset and the takeover sweep — is sound for `status`, but that same
  `update()` also writes `phone`, `pushName`, `connectedAt` and `lastActiveAt`. A stale generation
  writing a *stale* `phone` onto a peer's row would self-heal only at the owner's next `READY`, which is
  the same argument used to fence the terminal-unlink `phone` clear. Whether the asymmetry is deliberate
  or an oversight is not determinable from the comments, which discuss only the status column.
- **The `stop()` 502 path keeps its claim intentionally (W-44), and relies on `isEngineActive` returning
  false so the lease lapses.** But `stop()` reaches its 502 *after* `deleteIfLive`, so the engine is
  already out of the map — meaning `isEngineActive` is false and `releaseUnlessEngineActive` on the
  success path would have released. The 502 throws before that line is reached. Whether a wedged process
  surviving under an unclaimed row (a peer may then start a second engine against a still-live Chromium)
  was weighed against pinning is not stated anywhere in the source. The operator-facing message does say
  "restart the node to reap a leaked process", which suggests it was accepted rather than missed.
- **No spec was found pinning W-9's do-not-port ordering asymmetry.** The comment cites a "teardown-ordering
  audit" as its authority. If that audit is not a file in the repo, the asymmetry is protected by a
  comment alone — which is exactly the kind of invariant a refactor erases.
