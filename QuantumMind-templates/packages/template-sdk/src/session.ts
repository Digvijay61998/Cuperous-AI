import { api } from './api';

/**
 * Session-launch identifiers read from the template's URL, as built by
 * TemplateLaunchService.buildUrl() on the backend (?sid=&stk=&tid=).
 *
 * This is the SESSION flow: used by hosted templates opened from an
 * OPEN_TEMPLATE bot node that PAUSES the workflow until the customer
 * completes (or abandons) the template. It is distinct from the
 * fire-and-forget /template/actions/* calls in actions.ts, which have no
 * correlation back to a paused workflow node.
 */
export interface TemplateSessionIds {
  sessionId: string;
  token: string;
  templateId?: string;
}

/**
 * Reads ?sid=&stk=&tid= from the URL. Returns null when the template was
 * opened without a launch session (e.g. previewed directly in the dashboard,
 * or opened through the legacy vid/ph query-param flow instead) so callers
 * can fall back to the plain actions.ts flow.
 */
export const getSessionIds = (
  search: string = window.location.search,
): TemplateSessionIds | null => {
  const p = new URLSearchParams(search);
  const sessionId = p.get('sid');
  const token = p.get('stk');
  if (!sessionId || !token) return null;
  return { sessionId, token, templateId: p.get('tid') || undefined };
};

export interface TemplateSessionState {
  id: string;
  templateId: string;
  variables: Record<string, any>;
  status: string;
}

/**
 * Fetch the session record: dynamic variables to render + the workflow's
 * current status. Rejects if the link is invalid, expired, or was already
 * submitted (backend enforces this, not the client).
 */
export const fetchSession = (ids: TemplateSessionIds) =>
  api
    .get<TemplateSessionState>(`/template-session/${ids.sessionId}`, {
      params: { token: ids.token },
    })
    .then((res) => res.data);

/**
 * Marks the session as opened/in_progress. Call with 'opened' once on mount
 * and 'in_progress' as the customer starts filling the form, so a session
 * that was opened but abandoned can be told apart from one that was never
 * opened at all (the backend routes these differently on timeout).
 */
export const sendHeartbeat = (
  ids: TemplateSessionIds,
  phase: 'opened' | 'in_progress' = 'opened',
) =>
  api.post(
    `/template-session/${ids.sessionId}/heartbeat`,
    { phase },
    { params: { token: ids.token } },
  );

export interface SubmitSessionInput {
  idempotencyKey?: string;
  data: Record<string, any>;
  attachments?: { url: string; type: string; filename: string }[];
  category?: string;
  industry?: string;
  primaryDate?: Date | string;
  primaryAmount?: number;
}

/**
 * Marker on every message we post to the embedding page. The widget checks it
 * (plus the frame's origin) before acting, so unrelated postMessage traffic on
 * the host page can't drive the chat UI.
 */
export const TEMPLATE_FRAME_SOURCE = 'jarcube-template';

export type TemplateFrameEvent = 'submitted' | 'close';

/**
 * Tells the embedding chat widget what just happened, so it can close the
 * template panel and hand control back to the conversation.
 *
 * No-ops when the template is NOT in an iframe (opened in its own tab), which
 * is still a supported way to run templates.
 *
 * targetOrigin is '*' because a template is embedded by customer sites on
 * arbitrary domains and cannot know the parent origin ahead of time. That is
 * safe only because this payload carries no session token or customer data —
 * keep it that way.
 */
export const notifyParent = (event: TemplateFrameEvent) => {
  try {
    if (typeof window === 'undefined' || window.parent === window) return;
    window.parent.postMessage(
      { source: TEMPLATE_FRAME_SOURCE, event },
      '*',
    );
  } catch {
    // Embedding page may be gone or blocked; never break the submit flow.
  }
};

/**
 * Submits the completed template. This resumes the paused bot workflow on
 * the backend (via the template.submitted event) — it is the only way an
 * OPEN_TEMPLATE bot node ever continues past its pause point, so templates
 * using the session flow must call this instead of actions.ts helpers.
 */
export const submitSession = (
  ids: TemplateSessionIds,
  input: SubmitSessionInput,
) =>
  api
    .post(`/template-session/${ids.sessionId}/submit`, input, {
      params: { token: ids.token },
    })
    .then((res) => {
      // Only after the backend has accepted it — closing the panel on a failed
      // submit would strand the customer with no way back and no booking.
      notifyParent('submitted');
      return res.data;
    });
