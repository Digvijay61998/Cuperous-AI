import { api } from './api';
import { getContext, resolveTemplateId } from './context';

/**
 * Lightweight analytics hooks. Phase 2 will wire these to a real analytics
 * endpoint; for now they POST best-effort and never throw so they can't break
 * a template. Events: view, complete, abandon, custom.
 */
export type AnalyticsEvent =
  | 'view'
  | 'start'
  | 'complete'
  | 'abandon'
  | 'error'
  | string;

export const track = async (
  event: AnalyticsEvent,
  payload: Record<string, any> = {},
): Promise<void> => {
  const ctx = getContext();
  const templateId = resolveTemplateId();
  try {
    await api.post('/template/analytics', {
      event,
      templateId,
      visitorId: ctx.visitorId,
      botId: ctx.botId,
      conversationId: ctx.conversationId,
      platform: ctx.platform,
      ts: Date.now(),
      ...payload,
    });
  } catch {
    // analytics must never break the template
  }
};

/** Fire a view event once on load. */
export const trackView = () => track('view');
