/**
 * End causes that leave a conversation in the widget Ended_State
 * (crm-incident-handover R14.2, R14.5, R14.7): the visitor or the closure
 * flow closed it. An expiry or a disconnect is not an Ended_State; a reload
 * after those starts a fresh conversation (R9.11).
 */
export const ENDED_STATE_CAUSES: ReadonlySet<string> = new Set([
  "closure_resolved",
  "idle",
  "close_chat",
]);
