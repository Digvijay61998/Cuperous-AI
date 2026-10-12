# Implementation Plan

- [x] 1. Backend alert core
  - [x] 1.1 Create `src/handover-alert/` module (entity, provider, enums, constants, `@Global` module) with the `handover_alerts` schema and indexes, including the partial unique index on `conversationId` where `status: 'open'`
    - _Requirements: 1.1, 1.3, 1.5_
  - [x] 1.2 Add `AgentService.findOrgAdminIds(botId)` and `InboxEventsService.emitToUsers(userIds, event, data)`
    - _Requirements: 1.1, 8.1, 8.3_
  - [x] 1.3 Implement `HandoverAlertService.raise` (preview skip, recipient resolution, insert with retry, duplicate-key → emergency upgrade, emit `inbox:handover-requested`) and `setAssigned`
    - _Requirements: 1.1–1.7, 2.1–2.5, 8.1–8.3, 9.6_
  - [x] 1.4 Implement `acknowledge`, `acknowledgeByThread`, `acknowledgeByConversation` (first-wins `findOneAndUpdate`, recipient/org check, emit `inbox:handover-acknowledged`) and `listOpenForUser`
    - _Requirements: 7.3–7.8_
  - [x] 1.5 Add `HandoverAlertController` (`GET /handover-alerts`, `POST /handover-alerts/:id/ack`) with `@Roles(...ORG_ROLES)` (agents are recipients too) and DTO validation
    - _Requirements: 7.1, 7.6, 7.8_
  - [x]* 1.6 Add pinned `fast-check`; write `handover-alert.service.spec.ts` covering once-per-request under concurrency, monotonic priority, first-ack-wins, recipient scoping, preview mode, persistence retry
    - _Properties 1, 2, 6, 7_

- [x] 2. Backend hook points
  - [x] 2.1 Extend `BotPayload` with `emergency?: boolean`; call `raise` in `TransferToAgent` before `assignAgent`, then `setAssigned` on success
    - _Requirements: 2.1, 2.2, 2.4, 8.1_
  - [x] 2.2 In `handleAiResponse`, handle `handover === true` (raise `ai_escalation`, send non-empty answer, FAILURE child else TransferToAgent, truncate reason to 200)
    - _Requirements: 3.3–3.8_
  - [x] 2.3 Agent_Intent hook in `handleMessage`, active only when `botSettings.agentIntents` is non-empty
    - _Requirements: 2.3_
  - [x] 2.4 Acknowledge on `markThreadRead` (opened) and `setBotControl` takeover (taken_over)
    - _Requirements: 7.3_
  - [x] 2.5 Emit `conversation.ended` from `endConversation` / `endConversationByAgent`; ack open alerts before the 2-hour expiry cron; add listener
    - _Requirements: 7.5, 8.6_
  - [x] 2.6 Emit `agent.online` from `SocketStateService.add`; `replayForAgentOnline` sends `inbox:handover-pending`
    - _Requirements: 8.4, 8.5_
  - [x] 2.7 Add derived `senderRole` to `toMessageView` / bridge payloads and to the `sendMessageToAgent` `message` payload (plus `conversationId`)
    - _Requirements: 4.6, 4.7, 5.1, 9.1_
  - [x] 2.8 Add `notificationPrefs` to the Agent entity, return it from `getMe`, add `PATCH /agent/me/notification-prefs`
    - _Requirements: 6.1, 6.8_
  - [x]* 2.9 Unit tests for `TransferToAgent` and `handleAiResponse` hooks (handover true/false/non-boolean, with/without FAILURE child, emergency flag)
    - _Property 3_

- [x] 3. Checkpoint: backend builds and Jest passes; ask the user if questions arise

- [x] 4. AI service escalation signal
  - [x] 4.1 Add `handover` and `handover_reason` to `QueryResponse`
    - _Requirements: 3.1_
  - [x] 4.2 Add `detect_human_request` pre-check, `<<HANDOVER: …>>` prompt instruction and tag stripping in `query.py`
    - _Requirements: 3.2_
  - [x] 4.3 Add the `handover` eval suite (≥5 true, ≥5 false including "can't connect you to an agent") and runner pass/fail on `handover`
    - _Requirements: 3.9_
  - [x]* 4.4 pytest for detection and tag stripping

- [x] 5. Dashboard alert client
  - [x] 5.1 Add sound assets `public/sounds/handover.wav`, `emergency.wav`, `message-soft.wav` (generated tones)
    - _Requirements: 4.3, 5.2_
  - [x] 5.2 Implement `src/services/alerts/alertPolicy.ts` (pure policy functions) and `soundPlayer.ts` (autoplay rejection → `soundBlocked`)
    - _Requirements: 4.1, 4.5–4.7, 5.1–5.7, 6.2, 6.3, 6.6_
  - [x] 5.3 Implement `tabCoordinator.ts` (BroadcastChannel + localStorage played-id claim, prefs sync)
    - _Requirements: 6.4, 6.5, 6.7_
  - [x] 5.4 Add `alerts` Redux slice (alerts map, prefs, fetch with retry/timeout, ack, saveSoundPrefs with rollback); alias `enableSound`/`handleSoundToggle`
    - _Requirements: 6.1, 6.8, 7.1, 7.2, 7.9_
  - [x] 5.5 Add socket methods `onHandoverRequested`, `onHandoverAcknowledged`, `onHandoverPending`; replace both sound blocks in `AuthContext.tsx` with `AlertClient`; fetch on init and reconnect
    - _Requirements: 4.1–4.9, 7.1, 7.2, 8.5, 9.1–9.5_
  - [x] 5.6 Build `HandoverAlertBell` (badge, ordered list, sound switches, "Enable sound" banner) and `HandoverToast` (10s normal, sticky high, dismiss on ack)
    - _Requirements: 4.2–4.4, 6.3, 7.1, 7.4_
  - [x] 5.7 Add `useChatViewport` updates from `ThreadLog` and `active-chat/ChatLog` for focused/at-bottom suppression
    - _Requirements: 5.5_
  - [x]* 5.8 Add pinned `vitest` + `fast-check` and a `test` script; property tests for `alertPolicy` and `tabCoordinator`
    - _Properties 4, 5, 8_

- [x] 6. Flow builder and sample flow
  - [x] 6.1 Add Emergency switch to `bot-components/TransferChat.tsx`, saving `payload: {group, emergency}`
    - _Requirements: 2.8, 2.9_
  - [x] 6.2 Set `payload.emergency: true` on `kone_agent_emg` in `kone-mykone-assistant-flow.json`
    - _Requirements: 2.2_

- [ ] 7. Final checkpoint: UI build, backend build/tests, AI tests; manual KONE flow walkthrough (emergency high sound, talk-to-KONE normal sound, no sound on bot/AI replies, two tabs one sound, reload shows bell silently, opening thread clears everywhere)
