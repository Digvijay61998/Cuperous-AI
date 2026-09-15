# WhatsApp Web + Dynamic Template Integration

## Purpose
Define a development-first approach to make WhatsApp Web flow stable and smooth, while enabling dynamic template editing from dashboard and template submission storage.

This plan starts with template editing and response capture, then wires WhatsApp Web delivery behavior around reliable primitives.

## Product Goal
1. Agent/bot sends booking (or other) template links over WhatsApp Web.
2. User opens link in WhatsApp in-app webview/browser and completes template flow.
3. Admin can dynamically edit template content/config from dashboard for multi-client reuse.
4. Template submissions are stored, traceable to bot, conversation, visitor, and channel.

## Current System State (Verified)

### Template management
- Template entity already stores dynamic schema and overrides:
  - src/template/entities/template.entity.ts
  - configSchema[] + configValues map
- Public runtime config exists for hosted templates:
  - GET /template/:id/config
  - src/template/template.controller.ts
- Config update endpoint exists:
  - PATCH /template/:id/config
  - src/template/template.controller.ts
- Service merges config updates into configValues:
  - src/template/template.service.ts

### Dashboard template editing
- UI currently edits metadata and uploads ZIP versions only:
  - QuantumMind-ui/src/views/templates/EditTemplateDrawer.tsx
- RTK thunk for config update already exists but is not used by dynamic form UI:
  - QuantumMind-ui/src/store/apps/template/index.tsx
  - updateTemplateConfig()

### WhatsApp Web sending behavior
- Interactive BUTTONS/QUICK_REPLY are degraded to numbered text list:
  - src/whatsapp-web/whatsapp-web-inbound.service.ts
- MAPS currently sent as Google Maps URL text fallback.
- Reliable sending currently text/media centric via Baileys engine.

### Template SDK actions vs backend reality
- SDK calls planned endpoints:
  - /template/actions/appointment
  - /template/actions/form
  - /template/actions/lead
  - /template/actions/slot
  - /template/actions/upload
  - /template/actions/payment
  - /template/actions/quote
  - /template/actions/products
  - File: QuantumMind-templates/packages/template-sdk/src/actions.ts
- These endpoints are not implemented in current backend template module.

## Important Clarification: Are responses stored today?
- Chat messages are stored in conversation/message infrastructure.
- Structured template action submissions are not stored yet, because /template/actions/* endpoints are missing.
- Therefore, booking/template form results are currently not persisted through a dedicated backend contract.

## Architecture Decisions
1. Keep WhatsApp Web reliable-first: text, media, URL CTA, numbered choices, optional poll.
2. Use hosted template links as the main interactive UI surface.
3. Implement structured backend storage for template submissions before advanced WhatsApp interaction experiments.
4. Make dynamic template editor schema-driven using template.configSchema.

## Phase Plan

## Phase 1: Dynamic Template Editing (Start Here)
Goal: Admin can edit per-template config values from dashboard and publish instantly.

Backend tasks
1. Add strict validation for configValues against configSchema in template service.
2. Reject unknown keys and wrong types with clear 400 errors.
3. Add normalization rules for each type:
   - text, color, number, boolean, select
4. Keep merge behavior, but enforce schema guard.

Frontend tasks
1. Extend EditTemplateDrawer to render form controls from selectedTemplateDetail.configSchema.
2. Group fields by schema group.
3. On save, call updateTemplateConfig with payload:
   - { configValues: { ... } }
4. Keep metadata save path unchanged.
5. Add live preview link open button using template hostedUrl and query context.

Deliverables
1. Schema-driven editor in dashboard.
2. Safe backend validation for dynamic config writes.
3. Runtime template reflects saved values via GET /template/:id/config.

## Phase 2: Template Submission Storage (Core Gap) — ✅ Implemented
Goal: Save booking/form responses from hosted template flows.

Implementation notes:
- `TemplateActionSubmission` entity: `src/template/entities/template-action-submission.entity.ts`
- Enums: `src/template/enums/template-action-type.enum.ts`, `template-action-status.enum.ts`
- DTOs: `src/template/dto/create-template-action.dto.ts`, `search-template-action.dto.ts`
- Service: `src/template/template-action.service.ts` (validates template exists, splits context vs. payload, dedupes on `requestId`, reuses `UploadService` for `/upload`)
- Controller: `src/template/template-action.controller.ts` — all action routes are `@Public()` (visitor-facing, matching `GET /template/:id/config`); `GET /template/actions/submissions` is bearer-protected for dashboard use.
- `/template/actions/products` currently returns an empty list placeholder (no catalog domain exists yet).

Backend tasks
1. Create TemplateActionSubmission entity/collection.
2. Required fields:
   - templateId
   - actionType
   - payload
   - botId
   - conversationId
   - visitorId
   - phone
   - platform
   - source (whatsapp_web/widget/etc)
   - timestamps
3. Add controller routes under /template/actions:
   - POST /appointment
   - POST /form
   - POST /lead
   - POST /slot
   - POST /upload
   - POST /payment
   - POST /quote
   - GET /products
4. Validate and sanitize all payloads.
5. Add lightweight dedupe key for retries (optional requestId).

Template SDK alignment
1. Keep existing SDK endpoints unchanged to avoid template-side breakage.
2. Add success response contract with submissionId.

Deliverables
1. Structured submission storage enabled.
2. Booking responses queryable by bot/template/date/channel.
3. SDK actions become functional without per-template custom backend work.

## Phase 3: WhatsApp Web Booking Delivery Flow
Goal: Smooth CTA flow from WhatsApp Web to hosted template.

Backend tasks
1. Add helper to generate signed/parameterized template URL:
   - includes bid, cid, vid, ph, src=whatsapp, tid, lang
2. Add send-template-link service path used by bot node OPEN_TEMPLATE.
3. Outbound message format:
   - Prompt text
   - Direct URL
   - Optional numbered fallback options
4. Keep BUTTONS/QUICK_REPLY text fallback for reliability.

Optional enhancement
1. Add poll-based selection for single-choice prompts where suitable.

Deliverables
1. One-click booking link delivery from chat.
2. Stable behavior across personal WhatsApp Web sessions.

### Phase 3 discovery — ✅ Implemented (built on an existing session system)
Before starting Phase 3, a separate, already-mature `src/template-session/`
module was found (outside `src/template/`, not surfaced during Phase 1/2
research). It already provides everything this phase describes, via a
different mechanism than originally planned:
- `TemplateLaunchService` builds a signed launch URL using an opaque
  session token (`?sid=<sessionId>&stk=<token>&tid=<templateId>`) instead of
  the raw `vid/ph/bid/cid/src/tid/lang` params described above.
- `handleOpenTemplate` (`message-handler.service.ts`) creates the session,
  sends the CTA via the active messaging provider (feature-flagged per
  channel), and **pauses** the workflow.
- `TemplateSessionController` exposes `GET /template-session/:id`,
  `POST /:id/heartbeat`, `POST /:id/submit` (all `@Public()`), backed by its
  own `TemplateSubmission` model (separate from Phase 2's
  `TemplateActionSubmission`).
- On submit, a `template.submitted` event **resumes** the paused bot node;
  a 5-minute cron sweep routes never-opened sessions to `FAILURE` (expired)
  and opened-but-abandoned sessions to `TIMEOUT`.

Real gap found and closed this phase:
1. `template-sdk` had no client for this flow — `context.ts`/`actions.ts`
   only know the legacy `vid/ph/bid/cid/tid` params and post to
   `/template/actions/*`. Added `src/session.ts` (`getSessionIds`,
   `fetchSession`, `sendHeartbeat`, `submitSession`) and exported it from
   the package so hosted templates can actually drive the session flow.
2. `handleOpenTemplate` marked the session `LAUNCHED` and fired
   `template.launched` unconditionally, even if the provider's
   `sendMessage()` failed (e.g. WhatsApp Web session down) — the workflow
   would then hang paused forever with no signal. Now the send result is
   checked: on failure the session is marked `FAILED`
   (`TemplateSessionService.markFailed`, new) and the node routes to its
   `FAILURE` child if one exists.

Not done yet (follow-up, not required for Phase 3): existing hosted
templates (`salon-booking-template`, `doctor-appointment`,
`food-order-app`) still call `createAppointment` from `actions.ts` and have
not been migrated to `getSessionIds`/`submitSession`. Migrate a template's
submit handler by checking `getSessionIds()` first and falling back to the
legacy actions flow when no session is present.

## Phase 4: Inbound Reply Mapping for Numbered Options
Goal: Better UX parity when degraded options are used.


Tasks
1. Store pending option map per conversation:
   - index -> button value/goto target
2. Parse incoming numeric replies (1,2,3...) and map to canonical button value.
3. Pass resolved value to existing message handler path.

Deliverables
1. Reliable pseudo-button behavior without native interactive dependency.

## Phase 5: Observability and Operational Hardening
Goal: Make flows supportable in production.

Tasks
1. Add logs and metrics:
   - link sent
   - template opened (from analytics)
   - submission created
   - submission failed validation
2. Add dashboard table for submissions with filters.
3. Add export CSV endpoint (optional).
4. Add guardrails for oversized payloads and upload content types.

## Data Model Proposal

### TemplateActionSubmission
- _id
- templateId: ObjectId
- actionType: enum(appointment, form, lead, slot, upload, payment, quote)
- payload: Mixed
- botId: string
- conversationId: string
- visitorId: string
- phone: string
- platform: string
- source: string
- status: enum(received, processed, failed) default received
- requestId: string optional
- createdAt
- updatedAt

### Optional specialized Appointment
If appointment domain grows quickly, extract appointment-specific collection later. Start with unified submission collection for speed.

## API Contracts (Initial)

### POST /template/actions/appointment
Request
- service
- practitioner
- date
- slot
- name
- phone
- notes
- visitor context fields

Response
- ok: true
- submissionId
- message

### GET /template/actions/products
- Return product list based on bot/template context.
- Can be mocked initially for templates that need catalog data.

## Security and Validation
1. Keep template actions protected by origin/context validation and rate limits.
2. Validate templateId existence and published status where needed.
3. Sanitize strings and URLs from payload.
4. Enforce upload file type and size limits.

## Testing Plan
1. Unit tests for config schema validator.
2. Unit tests for each /template/actions route validator.
3. Integration test:
   - open template config
   - submit appointment
   - verify persisted row
4. End-to-end smoke:
   - WhatsApp link sent
   - open hosted template
   - submit booking
   - verify dashboard visibility.

## Recommended Development Order
1. Phase 1: Dynamic config editor and backend schema validation.
2. Phase 2: /template/actions storage endpoints.
3. Phase 3: OPEN_TEMPLATE send-link flow hardening for WhatsApp Web.
4. Phase 4: Numeric reply mapping.
5. Phase 5: Submissions dashboard + metrics.

## Definition of Done (MVP)
1. Admin edits template fields dynamically from dashboard.
2. WhatsApp message delivers booking template link reliably.
3. User completes booking flow.
4. Submission is stored with bot/conversation/visitor context.
5. Agent can see submission in dashboard and continue workflow.
