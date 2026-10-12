/**
 * Tiny module-level store: which conversation/thread this tab is showing and
 * whether its message list is scrolled to the latest message. Written by the
 * chat logs on scroll, read by the alert client. Kept out of Redux on purpose —
 * it changes on every scroll event and nothing renders from it.
 */
interface ViewportState {
  openId: string | null;
  atBottom: boolean;
}

const state: ViewportState = { openId: null, atBottom: true };

/** Px tolerance so sub-pixel scroll positions still count as "at bottom". */
const BOTTOM_SLACK_PX = 48;

export function setOpenChat(id: string | null | undefined) {
  state.openId = id ? String(id) : null;
  state.atBottom = true;
}

export function reportScroll(el: { scrollTop: number; scrollHeight: number; clientHeight: number } | null) {
  if (!el) return;
  state.atBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_SLACK_PX;
}

export function isOpenHere(...ids: Array<string | null | undefined>): boolean {
  return !!state.openId && ids.some((id) => id && String(id) === state.openId);
}

export function isAtBottom(): boolean {
  return state.atBottom;
}

export function tabFocused(): boolean {
  if (typeof document === 'undefined') return false;
  return document.visibilityState === 'visible' && document.hasFocus();
}
