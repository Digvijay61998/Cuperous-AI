# CRM, incident handover and visitor profile — operations

Spec: `.kiro/specs/crm-incident-handover/` (requirements R1–R22, decisions D1–D11, design, tasks).
This page is for running it: flags, settings, migration, rollout, dry run, and what to check when something looks wrong.

> **Changed by crm-plugins-service-desk** (see [`CRM-PLUGINS-SERVICE-DESK.md`](./CRM-PLUGINS-SERVICE-DESK.md)):
> - `crmCapture` is **retired**. Contact capture is always on, for every bot and every channel (widget, WhatsApp, WhatsApp-web, Telegram, Messenger, templates, the agent). "Ask once" is always on. Conflicting emails/phones are no longer asked about: the newest becomes Current and the old one is kept.
> - **Service Requests (tickets) live in the CRM Postgres database**, not the Mongo `tickets` collection, and are worked on CRM → Service Requests. The incident stores the request's CRM id. The `/tickets` routes still work with the same shapes. Old Mongo tickets were not migrated.
>
> Rows and steps below that mention `crmCapture` or the Mongo ticket describe the earlier release.

## What it does

- **Every request for a person becomes an Incident with a Service Request** (`SR_…`), linked to a CRM contact, an anonymous one if the visitor gave no details. The visitor is told the request is recorded; never whether agents are online (D2). The bot keeps answering until an agent takes over.
- **One CRM contact per person**, found by email, then phone. Details are asked once and pre-filled after that. A conflicting email or phone is asked about, never silently merged.
- **One owner per conversation** in the inbox; admins override explicitly. See [`OMNICHANNEL-INBOX.md`](./OMNICHANNEL-INBOX.md).
- **Clean endings:** at the end of a flow the bot asks "Is your query resolved?" instead of restarting the menu; the widget shows an Ended_State with "Start new chat".
- **One rolling Visitor_Profile per contact** replaces stored transcripts. The AI uses it in later answers; agents see it instead of old chats.
- **The bot learns from agent resolutions:** a resolved incident with a note becomes an approved Question Bank entry (personal data removed) and enters the AI knowledge base.

Web widget only (D7). WhatsApp and other channels keep their old behaviour.

## Flags (per bot, `BotSetting.features`, all default off)

Set in the dashboard: Bots → settings → "Agent requests and CRM". Only literal `true` counts.

| Flag | Dashboard label | What it changes | Needs |
|---|---|---|---|
| ~~`crmCapture`~~ | — (removed) | **Retired by crm-plugins-service-desk:** capture is always on; the stored value is ignored. | — |
| `incidentHandover` | Record agent requests as incidents | TRANSFER_TO_AGENT opens Incident + Service Request, one handover message, problem question when no problem is known, acknowledgement email | — (works better with `crmCapture`) |
| `closurePrompt` | Ask if the query is resolved | Closure prompt at terminal outcomes, idle close, Ended_State | widget and backend from the same release |
| `profileSummaries` | Summarise chats into the visitor profile | Profile merge when a chat ends; profile in AI answers and agent views; chat purge (see `PROFILE_PURGE_MODE`) | `crmCapture`, AI `/profile/merge` |
| `autoLearn` | Learn from agent resolutions | Resolved-by-agent incidents with a note become approved Question Bank entries and knowledge-base sources `incident:<id>` | `incidentHandover`, AI `/knowledge/*` |

Turning a flag off stops the behaviour for new events. Nothing already written is undone.

## Server settings

| Variable | Default | Purpose |
|---|---|---|
| `CRM_DATABASE_URL` | local Postgres | The shared CRM database (D11: one database, isolated by `organizationId`). |
| `PROFILE_PURGE_MODE` | `dry_run` | `dry_run`: profiles are merged, chats are kept and marked `would_purge`. `live`: chats are deleted after a successful merge. **Deletion cannot be undone.** |
| `ORG_MAIL_FROM` | mail default | Sender of acknowledgement and incident reply emails. |

Bot settings with limits (sanitised on save): `handoverMessage` (`{{ticketId}}`), `problemQuestion`, `problemAlias`, `contactMapping`, `closurePromptText`, `closingMessage` (≤ 500 characters each), `closureIdleMinutes` (1–60, empty = 10).

## Migration

Migration `20261008120000_crm_incident_profile` adds the chat-capture columns, the profile columns and a partial unique index on `(organizationId, lower(email))` for active contacts. Index creation fails if duplicates exist, so:

```bash
cd QuantumMind-backend
npm run crm:dup-check        # read-only; exit 1 lists duplicate active emails per org
# resolve any duplicates by hand in the CRM (archive or edit), re-run until OK
npx prisma migrate deploy
npx prisma migrate status    # "Database schema is up to date!"
```

Mongo changes are additive; existing documents need no backfill (R15.4).

## Deploy together

- **Backend + widget** in the same release. An older widget ignores `conversation-ended`, and an `ended` resume returns no token.
- **AI service image** must include `/extract/contact`, `/profile/merge`, `/knowledge/candidate` and `/knowledge/similar`. Without them the backend degrades safely: extraction falls back to regexes, merges fail and chats are kept, learning fails and is recorded on the incident.
- **KONE flow:** re-import `docs/koneTrainingData/bot/kone-mykone-assistant-flow.json` (`PATCH /api/bots/:botId/flow`).

## Rollout (production)

Do this per organization, one flag at a time, in this order. Wait for each check before the next step.

1. `npm run crm:dup-check`, then `npx prisma migrate deploy` (above).
2. **`crmCapture`.** Check: new contacts appear with source CHAT; a second chat with the same email links to the same contact; no rise in 500s on `/crm/*`.
3. **`incidentHandover`.** Check: "talk to an agent" gives one message with an `SR_…` ref; the incident and ticket appear; agents get the alert; nobody sees "No agent is available".
4. **Ownership** (always on with the release). Check: two agents cannot both take a chat; the admin override is logged.
5. **`closurePrompt`.** Check: terminal outcomes ask the closure question; "Yes, resolved" shows the Ended_State; a reload stays ended.
6. **`profileSummaries` with `PROFILE_PURGE_MODE=dry_run` for one week.** Review profiles (below). Then set `PROFILE_PURGE_MODE=live` and restart.
7. **`autoLearn`.** Check: a resolved incident with a note produces one Question Bank entry labelled "Learned from incident", with no names, emails, phones or `SR_` refs.
8. Watch the **agent-share** card (bot settings page, `GET /reports/agent-share?bot=<id>`). Target: 1% or less.

Rollback: switch the flag off. Data already written stays.

## Dry run and the switch to live

In `dry_run` every ended widget conversation of a bot with `profileSummaries` is merged into its contact's profile and marked, never deleted:

| `transcriptState` | Meaning |
|---|---|
| `kept` | Default. Not processed yet, or no contact could ever be linked. |
| `pending_merge` | The merge failed; the daily run retries. Chats kept. |
| `would_purge` | Dry run: would have been deleted (`transcriptPlan`: `purge` or `summarise`). |
| `summarised` / `purged` | Live: chats deleted, after a merge / with nothing to merge. |

What to review during the week:

- The daily log line `[profile lifecycle] mode=dry_run run={...} would_purge_total=N` (03:30 server time).
- A sample of contacts: CRM → contact → "Visitor profile". Entries are dated, newest first, carry ticket refs, and contain no emails or phone numbers.
- `pending_merge` should stay near zero. Inspect `lastMergeError` on those conversations.

Then set `PROFILE_PURGE_MODE=live` and restart. The next daily run deletes the chats of `would_purge` conversations without merging again, and repairs any marked-but-not-deleted ones.

Rules that always hold (Property 7): chats of an open incident are kept until it closes; chats are deleted only after a successful merge; a conversation with no contact and no incident is deleted without generating anything. After four failed merges (end of chat plus three daily retries) a plain `ai: false` entry is written so the chats can be released.

## Background jobs

| Job | When | Does |
|---|---|---|
| `crm-outbox-drain` | every minute | Retries failed CRM and knowledge-base writes at 1, 3 and 10 minutes, then marks them failed (`crm.outbox.failed`). |
| `incident-problem-expiry` | every minute | Drops problem questions unanswered for 10 minutes. |
| `closure-idle-close` | every minute | Closes conversations whose closure prompt got no reply within `closureIdleMinutes`. |
| `profile-session-lifecycle` | daily 03:30 | Merge retries, missed end events, repair of undeleted chats, dry-run report. |
| conversation expiry | every 2 hours | Existing: marks old open conversations expired. |

All are safe on several instances: each item is claimed with a conditional write.

## Endpoints added

| Endpoint | Who |
|---|---|
| `GET /incidents`, `GET /incidents/:id`, `POST /incidents/:id/resolve` (note 10–2000) | org users; resolve: the owning agent |
| `GET /incidents/:id/context`, `GET /incidents/by-conversation/:id/context` | org users |
| `POST /incidents/:id/email-reply` | owning agent or org admin |
| `GET /crm/contacts/:id/links`, `GET /crm/conversations/:id/contact`, `POST /crm/conversations/:id/contact/details` | org users |
| `GET /crm/contacts/:id/profile` | org users |
| `PUT /crm/contacts/:id/profile/facts`, `DELETE …/facts/:key`, `DELETE …/entries/:key` | org admins |
| `POST /inbox/threads/:id/override` | org admins |
| `GET /reports/agent-share?bot&months` | org users |

Existing CRM, Service Request and Question Bank endpoints are unchanged (checked by `src/e2e/api-compat.spec.ts`). New request fields are optional; new response fields are only added.

## When something looks wrong

| Symptom | Look at |
|---|---|
| Contact not created | Preview mode creates nothing (capture is always on since crm-plugins-service-desk). `crm_outbox` items with `status: failed` and their `lastError`. |
| Two contacts for one person | Should not happen for the same email (unique index). Different email and phone pointing at two contacts gives a "Possible duplicate contact" note on both; merge by hand. |
| Incident open, visitor gone | Expected (D2): agents follow up by email from the incident. |
| AI answers ignore the visitor's history | `profileSummaries` on? Does the conversation have `crmContactId` (returning visitors are linked on the new conversation)? Contact profile empty? |
| Chats not deleted | `PROFILE_PURGE_MODE` still `dry_run`, an open incident, or `pending_merge` (see `lastMergeError`). |
| Learned entry missing | Incident `knowledge.status`: `failed` (see `knowledge.error`), `skipped` (no note, or not resolved by an agent). |
| Learned entry shows "Not in the AI knowledge base" | The knowledge-base sync failed after its retries. Edit and save the entry to retry. |

## Tests

```bash
cd QuantumMind-backend
npx jest                                  # unit, property and journey tests (Node 18 or 20)
npm run test:crm-int                      # journeys against the real CRM Postgres (CRM_DATABASE_URL)
cd ../QuantumMind-ai
docker run --rm --network host -v "$PWD":/app -w /app quantummind-ai-ai-service:latest \
  sh -c "pip install -q pytest && python -m pytest -q tests"
cd ../QuantumMind-ui && npx vitest run
```

Journey tests on the real KONE flow live in `QuantumMind-backend/src/e2e/`: two agents racing, closure then reload, preview writes nothing, golden transcripts with the flags on and off, and (Postgres) anonymous handover → details → merge, returning visitor profile, concurrent profile merges.
