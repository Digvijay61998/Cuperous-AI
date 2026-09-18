// ** Omnichannel inbox slice: channel tabs, per-channel thread lists, messages.
//
// Follows the dominant convention in this codebase (see
// src/store/apps/conversation/index.ts): createAsyncThunk + the shared Axios
// instance + toast.error on failure, with reducers in extraReducers.

// ** Redux Imports
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// ** Axios Imports
import Axios from 'src/helper/Axios';

// ** Toasters Imports
import { toast } from 'react-hot-toast';
import {
  InboxMessage,
  InboxMessageEvent,
  InboxMessageStatusEvent,
  InboxThread,
  InboxThreadUpdatedEvent,
} from 'src/services/socket.services';
import {
  applyStatus,
  expirePendingOptimistic,
  failOptimistic,
  mergeOrAppend,
  mergePage,
  reconcileOptimistic,
} from './merge';

/**
 * How long a reply may sit `pending` before it is shown as failed.
 *
 * Matches the backend's own 30s send timeout, so the client gives up at the same
 * moment the server would have — a shorter value would flag a reply the server is
 * still legitimately waiting on.
 */
const OPTIMISTIC_TIMEOUT_MS = 30 * 1000;

export interface InboxChannel {
  channel: string;
  threads: number;
  unread: number;
}

/** Mirrors InboxChannelState in the backend's inbox.constants.ts. */
export type InboxChannelState =
  | 'connected'
  | 'connecting'
  | 'awaiting_scan'
  | 'removed'
  | 'not_connected'
  | 'disabled'
  | 'session_expired'
  | 'reconnecting'
  | 'failed'
  | 'unknown';

export interface InboxChannelStatusAccount {
  sessionName: string;
  label?: string;
  state: InboxChannelState;
  phone?: string;
  detail?: string;
}

export interface InboxChannelStatus {
  channel: string;
  state: InboxChannelState;
  connected: boolean;
  accounts: InboxChannelStatusAccount[];
}

/** The tab id of the existing widget/agent chat box. Not a real channel. */
export const LIVE_CHAT_TAB = 'live';

const reportError = (error: any, label: string) => {
  console.log(`${label}:Error >>>>`, error);
  toast.error(
    error?.response?.data?.message || error?.message || 'Request failed',
  );
};

export const getInboxChannels = createAsyncThunk(
  'inbox/getChannels',
  async () => {
    try {
      const response = await Axios.get('/inbox/channels');
      return response.data;
    } catch (error: any) {
      reportError(error, 'Inbox channels API');
      throw error;
    }
  },
);

/**
 * Ask whether a channel can actually send right now.
 *
 * Silent on failure, unlike the other thunks here: this is a background health
 * probe that also runs on a poll, so surfacing a toast per failed attempt would
 * bury the agent in noise about the thing that is already being reported to them
 * as a banner. A failed probe simply leaves the previous answer in place.
 */
export const getInboxChannelStatus = createAsyncThunk(
  'inbox/getChannelStatus',
  async (channel: string) => {
    const response = await Axios.get(
      `/inbox/channels/${encodeURIComponent(channel)}/status`,
    );
    return { channel, status: response.data as InboxChannelStatus };
  },
);

export const getInboxThreads = createAsyncThunk(
  'inbox/getThreads',
  async (params: { channel: string; search?: string; before?: string }) => {
    try {
      const query: Record<string, string> = { channel: params.channel };
      if (params.search) query.search = params.search;
      if (params.before) query.before = params.before;
      const response = await Axios.get('/inbox/threads', { params: query });
      return { channel: params.channel, append: !!params.before, ...response.data };
    } catch (error: any) {
      reportError(error, 'Inbox threads API');
      throw error;
    }
  },
);

export const getInboxMessages = createAsyncThunk(
  'inbox/getMessages',
  async (params: { threadId: string; before?: string }) => {
    try {
      const query: Record<string, string> = {};
      if (params.before) query.before = params.before;
      const response = await Axios.get(
        `/inbox/threads/${params.threadId}/messages`,
        { params: query },
      );
      return { threadId: params.threadId, ...response.data };
    } catch (error: any) {
      reportError(error, 'Inbox messages API');
      throw error;
    }
  },
);

/**
 * Clear a thread's unread badge and send the customer read receipts.
 *
 * Fire-and-forget: a failed receipt has no consequence the agent can act on, so
 * a rejection is swallowed rather than toasted. The local badge is cleared
 * optimistically in the reducer regardless.
 */
export const markInboxThreadRead = createAsyncThunk(
  'inbox/markThreadRead',
  async (threadId: string) => {
    try {
      await Axios.post(`/inbox/threads/${threadId}/read`);
    } catch (error: any) {
      console.log('Inbox mark-read API:Error >>>>', error);
    }
    return threadId;
  },
);

/**
 * Send an agent reply.
 *
 * The optimistic row is appended by the caller BEFORE dispatching this, so the
 * bubble appears immediately; this thunk only reconciles or fails it. `rejectValue`
 * carries the server's machine-readable reason so the UI can explain the failure
 * without parsing prose.
 */
export const sendInboxMessage = createAsyncThunk(
  'inbox/sendMessage',
  async (
    params: {
      threadId: string;
      correlationId: string;
      message?: string;
      type?: string;
      mediaUrl?: string;
      mimetype?: string;
      fileName?: string;
      quotedMessageId?: string;
    },
    { rejectWithValue, dispatch, getState },
  ) => {
    try {
      const response = await Axios.post(
        `/inbox/threads/${params.threadId}/messages`,
        {
          message: params.message,
          type: params.type,
          mediaUrl: params.mediaUrl,
          mimetype: params.mimetype,
          fileName: params.fileName,
          quotedMessageId: params.quotedMessageId,
          // Sent so the server stores THIS id and echoes it back, letting the
          // socket echo fold onto the optimistic bubble we just rendered. Without
          // it the server mints its own and the two never match.
          correlationId: params.correlationId,
        },
      );
      return {
        threadId: params.threadId,
        correlationId: params.correlationId,
        ...response.data,
      };
    } catch (error: any) {
      const reason = error?.response?.data?.reason;
      toast.error(
        reason === 'session_not_connected'
          ? 'WhatsApp is not connected — the message was not sent'
          : error?.response?.data?.message ||
              error?.message ||
              'Message could not be sent',
      );
      // A failed reply is the strongest possible signal the channel is down —
      // stronger than the poll, which only runs once the banner is ALREADY
      // showing. Re-probe the active channel now so the connection banner
      // appears immediately instead of after the next 20s poll (or not at all,
      // if the drop happened while the agent was sitting on a healthy tab).
      // Best-effort: getInboxChannelStatus is silent on failure by design.
      if (reason === 'session_not_connected') {
        const channel = (getState() as any)?.inbox?.activeTab;
        if (channel && channel !== LIVE_CHAT_TAB) {
          dispatch(getInboxChannelStatus(channel));
        }
      }
      return rejectWithValue({
        threadId: params.threadId,
        correlationId: params.correlationId,
        reason,
      });
    }
  },
);

/**
 * Retry a failed reply under a fresh correlation id.
 *
 * A new correlation id, not the old one: `linkOutboundChannelMessage` binds the
 * channel's id onto whichever row carries the correlation id, and reusing the
 * failed row's id would let a successful retry stamp its result onto the old
 * failed bubble. A fresh id gives the retry its own row and leaves the failure as
 * a visible record — the same rule the backend relies on.
 *
 * Implemented as a thunk (not a reducer) because it needs to read the failed
 * row's content out of state, append a new optimistic row, and fire the HTTP
 * call — the same three steps the composer does for a first send.
 */
export const retryInboxMessage = createAsyncThunk(
  'inbox/retryMessage',
  async (
    params: { threadId: string; failedCorrelationId: string; senderId: string },
    { getState, dispatch },
  ) => {
    const state: any = getState();
    const list: InboxMessage[] =
      state.inbox.messagesByThread[params.threadId] || [];
    const failed = list.find(
      (m) => m.correlationId === params.failedCorrelationId,
    );
    if (!failed) return;

    const correlationId = `msg-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    dispatch(
      inboxOptimisticSend({
        threadId: params.threadId,
        correlationId,
        message: failed.message || '',
        type: failed.type || 'text',
        mediaUrl: failed.media?.url,
        mimetype: failed.media?.mimetype,
        fileName: failed.media?.fileName,
        quotedMessageId: failed.quotedMessageId,
        senderId: params.senderId,
      }),
    );

    dispatch(
      sendInboxMessage({
        threadId: params.threadId,
        correlationId,
        message: failed.message || undefined,
        type: failed.type || 'text',
        mediaUrl: failed.media?.url,
        mimetype: failed.media?.mimetype,
        fileName: failed.media?.fileName,
        quotedMessageId: failed.quotedMessageId,
      }),
    );

    // The old failed bubble is left in place as a record of the failure — the
    // retry appears as a new bubble beneath it, exactly as a fresh send would.
    return { threadId: params.threadId };
  },
);

/** Pause/resume the bot, or take a thread over and hand it back. */
export const setInboxBotControl = createAsyncThunk(
  'inbox/setBotControl',
  async (params: {
    threadId: string;
    botEnabled?: boolean;
    action?: 'takeover' | 'release';
  }) => {
    try {
      const response = await Axios.patch(
        `/inbox/threads/${params.threadId}/bot`,
        { botEnabled: params.botEnabled, action: params.action },
      );
      return response.data;
    } catch (error: any) {
      reportError(error, 'Inbox bot-control API');
      throw error;
    }
  },
);

/** Ask the channel for an older page of history (rate-limited server-side). */
export const requestInboxHistory = createAsyncThunk(
  'inbox/requestHistory',
  async (threadId: string) => {
    try {
      const response = await Axios.post(
        `/inbox/threads/${threadId}/history`,
      );
      return { threadId, ...response.data };
    } catch (error: any) {
      reportError(error, 'Inbox history API');
      throw error;
    }
  },
);

interface InboxState {
  channels: InboxChannel[];
  /** Per-channel connection health, keyed by channel. Absent until first probed. */
  channelStatus: Record<string, InboxChannelStatus>;
  activeTab: string;
  threadsByChannel: Record<string, InboxThread[]>;
  threadCursorByChannel: Record<string, string | null>;
  messagesByThread: Record<string, InboxMessage[]>;
  messageCursorByThread: Record<string, string | null>;
  hasMoreByThread: Record<string, boolean>;
  selectedThreadId: string | null;
  loadingChannels: boolean;
  loadingThreads: boolean;
  loadingMessages: boolean;
}

const initialState: InboxState = {
  channels: [],
  channelStatus: {},
  // The existing chat box stays the default view, so nothing changes for an
  // agent who does not use channels.
  activeTab: LIVE_CHAT_TAB,
  threadsByChannel: {},
  threadCursorByChannel: {},
  messagesByThread: {},
  messageCursorByThread: {},
  hasMoreByThread: {},
  selectedThreadId: null,
  loadingChannels: false,
  loadingThreads: false,
  loadingMessages: false,
};

/** Move a thread to the top of its channel list, inserting it if unknown. */
function promoteThread(
  state: InboxState,
  channel: string,
  thread: InboxThread,
) {
  const list = state.threadsByChannel[channel] || [];
  const rest = list.filter((t) => t.id !== thread.id);
  state.threadsByChannel[channel] = [thread, ...rest];
}

export const inboxSlice = createSlice({
  name: 'inbox',
  initialState,
  reducers: {
    setInboxTab: (state, action) => {
      state.activeTab = action.payload;
      // Switching tabs closes whatever thread was open, so a thread from the
      // previous channel is never left rendered under a different tab.
      state.selectedThreadId = null;
    },

    /**
     * Drop cached messages after a socket gap.
     *
     * Messages that arrived while the socket was down were never emitted to this
     * tab, so the cached list has a hole in the middle that no later event will
     * fill. Clearing forces the open thread to refetch. Thread LISTS are left
     * alone — they are refetched wholesale by `getInboxThreads` and dropping them
     * would blank the sidebar mid-reconnect.
     */
    inboxSocketGap: (state) => {
      state.messagesByThread = {};
      state.messageCursorByThread = {};
      state.hasMoreByThread = {};
    },

    selectInboxThread: (state, action) => {
      state.selectedThreadId = action.payload;
    },

    clearInboxThread: (state) => {
      state.selectedThreadId = null;
    },

    /**
     * Fold a live `inbox:message` into state.
     *
     * A reducer rather than a thunk because it is pure state folding with no I/O.
     * Three things happen: the message merges into the thread's list (only if
     * that list is already loaded), the sidebar row is promoted, and the tab
     * badge moves.
     */
    inboxMessageReceived: (state, action: { payload: InboxMessageEvent }) => {
      const { channel, threadId, message, thread } = action.payload;

      // Only merge into a list we already hold. Seeding a partial list from a
      // socket event would leave a thread showing one message with no way to
      // tell it apart from a fully-loaded one.
      if (state.messagesByThread[threadId]) {
        state.messagesByThread[threadId] = mergeOrAppend(
          state.messagesByThread[threadId],
          message,
        );
      }

      const isOpen = state.selectedThreadId === threadId;
      // The server's count includes the message that just arrived. If the agent
      // is looking at the thread it is not unread, so the row is shown as clear
      // and the read call (dispatched by the view) makes the server agree.
      const row: InboxThread = isOpen
        ? { ...thread, unreadCount: 0 }
        : thread;
      promoteThread(state, channel, row);

      // Recompute the badge from the rows we hold rather than incrementing a
      // counter: an increment drifts permanently once a single event is missed
      // or replayed, and a reconnect replays.
      const entry = state.channels.find((c) => c.channel === channel);
      const list = state.threadsByChannel[channel] || [];
      const unread = list.filter((t) => t.unreadCount > 0).length;
      if (entry) {
        entry.unread = unread;
        entry.threads = Math.max(entry.threads, list.length);
      } else {
        // First-ever message on a channel that had no tab: create it so the tab
        // appears without waiting for a channels refetch.
        state.channels.push({ channel, threads: list.length, unread });
      }
    },

    inboxThreadUpdated: (
      state,
      action: { payload: InboxThreadUpdatedEvent },
    ) => {
      const { channel, thread } = action.payload;
      const list = state.threadsByChannel[channel];
      if (!list) return;
      const idx = list.findIndex((t) => t.id === thread.id);
      // Update in place — this event carries no new message, so it must not
      // reorder the list and move a row under the agent's cursor.
      if (idx !== -1) list[idx] = thread;
    },

    /**
     * Render the agent's reply immediately, before the request is dispatched.
     *
     * Only appends to a list we already hold: seeding one from a send would leave
     * a thread showing a single message with no way to tell it apart from a fully
     * loaded one.
     */
    inboxOptimisticSend: (
      state,
      action: {
        payload: {
          threadId: string;
          correlationId: string;
          message: string;
          type: string;
          mediaUrl?: string;
          mimetype?: string;
          fileName?: string;
          quotedMessageId?: string;
          senderId: string;
        };
      },
    ) => {
      const p = action.payload;
      const list = state.messagesByThread[p.threadId];
      if (!list) return;

      state.messagesByThread[p.threadId] = mergeOrAppend(list, {
        // Namespaced so it can never collide with a Mongo id.
        id: `optimistic:${p.correlationId}`,
        correlationId: p.correlationId,
        optimistic: true,
        threadId: p.threadId,
        message: p.message,
        type: p.type,
        time: new Date().toISOString(),
        sender: p.senderId,
        direction: 'outbound',
        status: 'pending',
        quotedMessageId: p.quotedMessageId,
        media: p.mediaUrl
          ? {
              url: p.mediaUrl,
              mimetype: p.mimetype,
              fileName: p.fileName,
              omitted: false,
            }
          : undefined,
        historical: false,
      });
    },

    /**
     * Fail optimistic rows stuck `pending` past the timeout.
     *
     * Driven by a ticker in the thread view rather than a per-row timer, so the
     * number of timers does not grow with the conversation.
     */
    inboxExpirePending: (state, action: { payload: { threadId: string } }) => {
      const list = state.messagesByThread[action.payload.threadId];
      if (!list) return;
      state.messagesByThread[action.payload.threadId] =
        expirePendingOptimistic(list, OPTIMISTIC_TIMEOUT_MS);
    },

    inboxMessageStatusReceived: (
      state,
      action: { payload: InboxMessageStatusEvent },
    ) => {
      const { threadId, externalMessageId, status } = action.payload;
      const list = state.messagesByThread[threadId];
      if (!list) return;
      state.messagesByThread[threadId] = applyStatus(
        list,
        externalMessageId,
        status,
      );
    },
  },

  extraReducers: (builder) => {
    builder.addCase(getInboxChannels.pending, (state) => {
      state.loadingChannels = true;
    });
    builder.addCase(getInboxChannels.fulfilled, (state, action) => {
      state.loadingChannels = false;
      state.channels = action.payload?.channels || [];
    });
    builder.addCase(getInboxChannels.rejected, (state) => {
      state.loadingChannels = false;
    });

    builder.addCase(getInboxChannelStatus.fulfilled, (state, action) => {
      const { channel, status } = action.payload || ({} as any);
      if (!channel || !status) return;
      state.channelStatus[channel] = status;
    });
    // No `rejected` case on purpose: a failed probe must leave the last known
    // answer standing rather than blanking the banner, because "the request
    // failed" is not evidence that the channel recovered.

    builder.addCase(getInboxThreads.pending, (state) => {
      state.loadingThreads = true;
    });
    builder.addCase(getInboxThreads.fulfilled, (state, action) => {
      state.loadingThreads = false;
      const { channel, append, threads, nextCursor } = action.payload || {};
      if (!channel) return;
      state.threadsByChannel[channel] = append
        ? [...(state.threadsByChannel[channel] || []), ...(threads || [])]
        : threads || [];
      state.threadCursorByChannel[channel] = nextCursor ?? null;
    });
    builder.addCase(getInboxThreads.rejected, (state) => {
      state.loadingThreads = false;
    });

    builder.addCase(getInboxMessages.pending, (state) => {
      state.loadingMessages = true;
    });
    builder.addCase(getInboxMessages.fulfilled, (state, action) => {
      state.loadingMessages = false;
      const { threadId, messages, nextCursor, hasMore } = action.payload || {};
      if (!threadId) return;
      // Merged, not replaced: a socket event can land between the request and
      // its response, and replacing would drop that message until a refetch.
      state.messagesByThread[threadId] = mergePage(
        state.messagesByThread[threadId] || [],
        messages || [],
      );
      state.messageCursorByThread[threadId] = nextCursor ?? null;
      state.hasMoreByThread[threadId] = !!hasMore;
    });
    builder.addCase(getInboxMessages.rejected, (state) => {
      state.loadingMessages = false;
    });

    builder.addCase(sendInboxMessage.fulfilled, (state, action) => {
      const { threadId, correlationId, id, externalMessageId, status } =
        action.payload || {};
      const list = state.messagesByThread[threadId];
      if (!list) return;
      state.messagesByThread[threadId] = reconcileOptimistic(
        list,
        correlationId,
        { id, externalMessageId, status },
      );
    });

    builder.addCase(sendInboxMessage.rejected, (state, action) => {
      const payload = action.payload as any;
      if (!payload?.threadId) return;
      const list = state.messagesByThread[payload.threadId];
      if (!list) return;
      // The row stays rendered as `failed` so the agent can see what did not send
      // and retry it, rather than the message vanishing.
      state.messagesByThread[payload.threadId] = failOptimistic(
        list,
        payload.correlationId,
      );
    });

    builder.addCase(setInboxBotControl.fulfilled, (state, action) => {
      const thread = action.payload;
      if (!thread?.channel) return;
      const list = state.threadsByChannel[thread.channel];
      if (!list) return;
      const idx = list.findIndex((t) => t.id === thread.id);
      // In place: ownership changed, not activity, so the row must not reorder.
      if (idx !== -1) list[idx] = thread;
    });

    builder.addCase(markInboxThreadRead.fulfilled, (state, action) => {
      const threadId = action.payload;
      for (const channel of Object.keys(state.threadsByChannel)) {
        const list = state.threadsByChannel[channel];
        const idx = list.findIndex((t) => t.id === threadId);
        if (idx === -1) continue;
        list[idx] = { ...list[idx], unreadCount: 0 };
        const entry = state.channels.find((c) => c.channel === channel);
        if (entry) {
          entry.unread = list.filter((t) => t.unreadCount > 0).length;
        }
        break;
      }
    });
  },
});

export const {
  setInboxTab,
  selectInboxThread,
  clearInboxThread,
  inboxMessageReceived,
  inboxThreadUpdated,
  inboxMessageStatusReceived,
  inboxOptimisticSend,
  inboxExpirePending,
  inboxSocketGap,
} = inboxSlice.actions;

export default inboxSlice.reducer;
