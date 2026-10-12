import Router from 'next/router';
import { toast } from 'react-hot-toast';
import Axios from 'src/helper/Axios';
import { store } from 'src/store';
import { ackAlert } from 'src/store/apps/alerts';
import { addActiveMessage, getActiveconversations } from 'src/store/apps/conversation';
import { LIVE_CHAT_TAB, setInboxTab } from 'src/store/apps/inbox';

/** Widget conversations are mirrored into the inbox on this channel. */
export const WIDGET_CHANNEL = 'widget';

/** Open the conversation's mirror in the Web Chat tab (bot view, follow-up). */
function openThread(threadId?: string) {
  const query = threadId ? `?channel=${WIDGET_CHANNEL}&thread=${encodeURIComponent(threadId)}` : '';
  void Router.push(`/apps/chat/active${query}`);
}

/**
 * Open the conversation behind an alert and acknowledge it as `opened`.
 * Shared by the toast "Open" button and the bell list.
 *
 * A visitor waiting for a person is accepted as a live chat first, so it
 * lands in this agent's Live Chat tab (owner decision: every chat with an
 * agent is a live chat). If another agent already has it, or the visitor is
 * no longer in the chat, the Web Chat view opens instead for follow-up.
 */
export async function openHandoverAlert(id: string) {
  const alert = store.getState().alerts.byId[id];
  store.dispatch(ackAlert({ id, resolution: 'opened' }));
  const conversationId = alert?.conversationId;
  if (!conversationId) return openThread(alert?.threadId);
  try {
    const r = await Axios.post(`incidents/by-conversation/${encodeURIComponent(conversationId)}/accept-live`);
    if (r.data?.status === 'connected') {
      const res: any = await store.dispatch(getActiveconversations());
      const list: any[] = Array.isArray(res?.payload) ? res.payload : [];
      const conv = list.find((c) => String(c?._id) === String(conversationId));
      store.dispatch(setInboxTab(LIVE_CHAT_TAB));
      store.dispatch(addActiveMessage({ id: conversationId, visitorId: conv?.visitor?._id ?? conv?.visitor }));
      void Router.push('/apps/chat/active');
      return;
    }
    toast('The visitor has left the chat. You can follow up on the incident ticket.', { icon: 'ℹ️' });
  } catch (e: any) {
    const status = e?.response?.status;
    if (status === 409) toast.error(e?.response?.data?.message || 'Another agent is already handling this chat.');
    // 404: no incident (an older alert); the Web Chat view still works.
  }
  openThread(alert?.threadId);
}
