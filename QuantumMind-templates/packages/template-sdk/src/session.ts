import { api } from './api';
import { getContext } from './context';
import { showReturnToChatScreen, ReturnToChatOptions } from './return-to-chat';
import { track } from './analytics';

/**
 * Phase 2 template-session client. Wraps the backend session endpoints
 * (GET/heartbeat/submit) so templates never hand-build these calls, and
 * standardises the completion experience (return-to-chat screen).
 */

let heartbeatTimer: any = null;

interface SessionInfo {
  id: string;
  templateId: string;
  variables: Record<string, any>;
  status: string;
}

/** Load session info + the dynamic variables passed in from the workflow. */
export const loadSession = async (): Promise<SessionInfo | null> => {
  const { sessionId, sessionToken } = getContext();
  if (!sessionId || !sessionToken) return null;
  try {
    const { data } = await api.get(
      `/template-session/${sessionId}?token=${encodeURIComponent(sessionToken)}`,
    );
    return data;
  } catch {
    return null;
  }
};

/** Ping the backend so it can tell "opened" from "never opened". */
export const sendHeartbeat = async (phase: 'opened' | 'in_progress' = 'opened') => {
  const { sessionId, sessionToken } = getContext();
  if (!sessionId || !sessionToken) return;
  try {
    await api.post(
      `/template-session/${sessionId}/heartbeat?token=${encodeURIComponent(sessionToken)}`,
      { phase },
    );
  } catch {
    // heartbeat is best-effort
  }
};

/**
 * Call once on template mount: fires the "opened" heartbeat + a view event, and
 * keeps an "in_progress" heartbeat alive so long sessions aren't misclassified
 * as never-opened.
 */
export const initSession = async () => {
  track('view');
  await sendHeartbeat('opened');
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => sendHeartbeat('in_progress'), 60_000);
};

let submitting = false;

/**
 * Submit the completed form. On success, resumes the workflow (server-side) and
 * shows the standard return-to-chat screen.
 */
export const submitSession = async (
  payload: {
    data: Record<string, any>;
    category?: string;
    industry?: string;
    primaryDate?: string | Date;
    primaryAmount?: number;
    attachments?: { url: string; type: string; filename: string }[];
  },
  returnScreen: ReturnToChatOptions | false = {},
): Promise<{ ok: boolean; submissionId?: string }> => {
  const { sessionId, sessionToken } = getContext();
  if (!sessionId || !sessionToken) {
    return { ok: false };
  }
  if (submitting) return { ok: false };
  submitting = true;

  // Client-generated idempotency key so a retried request can't double-book.
  const idempotencyKey = `${sessionId}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;

  try {
    const { data } = await api.post(
      `/template-session/${sessionId}/submit?token=${encodeURIComponent(sessionToken)}`,
      { idempotencyKey, ...payload },
    );
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    track('complete');
    if (returnScreen !== false) {
      showReturnToChatScreen(returnScreen);
    }
    return { ok: true, submissionId: data?.submissionId };
  } catch (e: any) {
    track('error', { message: e?.message });
    return { ok: false };
  } finally {
    submitting = false;
  }
};
