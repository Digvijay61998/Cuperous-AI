import io, { Socket } from 'socket.io-client';
import { fromEvent, Observable } from 'rxjs';
import env from 'src/configs/environments';
import type {
  HandoverAcknowledgedEvent,
  HandoverAlert,
  HandoverPendingEvent,
  SenderRole,
} from 'src/services/alerts/types';

export interface ChatMessage {
  conversationId: string;
  message: {
    id: string;
    type: string;
    value: string;
    senderId: string;
    buttons?: unknown;
    delay?: number;
    switchToAgent?: boolean;
    agentId?: string;
    format?: string;
    /** Author category; only `visitor` messages may notify. */
    senderRole?: SenderRole;
    sender?: string;
    time?: string;
  };
}

export interface onNewVisitorAdded {
  _id: string;
  visitor: {
    _id: string;
    name: string;
  };
  lastMessage?: any;
}

// -----------------------------------------------------------------------------
// Omnichannel inbox payloads. Mirror the backend DTOs in
// QuantumMind-backend/src/inbox/inbox.mapper.ts.
// -----------------------------------------------------------------------------

export interface InboxMedia {
  mimetype?: string;
  fileName?: string;
  url?: string;
  /**
   * True when the channel had media we deliberately did not download. Never
   * absent — the backend always sends an explicit boolean, so the UI can tell
   * "no attachment" apart from "attachment not fetched" and render a 📎 the
   * agent can click rather than an empty bubble.
   */
  omitted: boolean;
}

export interface InboxMessage {
  id: string;
  /**
   * Channel-native id. Dedup on `externalMessageId ?? id`: a persisted row and a
   * live echo of the same message key differently, so anything keyed on `id`
   * alone double-adds.
   */
  externalMessageId?: string;
  threadId?: string;
  conversationId?: string;
  message: string;
  type: string;
  time: string;
  sender?: string;
  authorName?: string;
  direction?: 'inbound' | 'outbound';
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  media?: InboxMedia;
  quotedMessageId?: string;
  historical: boolean;
  /** Author category, derived server-side. Notifications key on this, never on `direction`. */
  senderRole?: SenderRole;
  /**
   * The correlation id an outbound message was stored under.
   *
   * Present on our own replies, and the key the client folds an echo onto its
   * optimistic placeholder with: the two are keyed differently (temp id vs the
   * channel's id) until the server identity is known, so without this the same
   * reply would render twice.
   */
  correlationId?: string;
  /**
   * True while this row exists only on the client, before the server has
   * confirmed it. Never sent by the server — set locally on an optimistic send
   * and cleared on reconcile.
   */
  optimistic?: boolean;
}

export interface InboxThread {
  id: string;
  channel: string;
  sessionName: string;
  chatId: string;
  phone?: string;
  name?: string;
  /** True when `name` is a real display name rather than a formatted phone number. */
  hasContactName?: boolean;
  /** `phone` formatted for display, e.g. `+91 82083 23163`. */
  phoneLabel?: string;
  avatarUrl?: string;
  unreadCount: number;
  botEnabled: boolean;
  handledByAgent: boolean;
  assignedAgent?: { id: string; name?: string; email?: string } | null;
  lastMessage?: Record<string, any> | null;
  lastMessageAt?: string | null;
  bot?: { id: string; name?: string } | null;
  visitor?: { id: string; name?: string; email?: string; phone?: string } | null;
  historyExhausted: boolean;
  oldestMessageAt?: string | null;
}

export interface InboxMessageEvent {
  channel: string;
  threadId: string;
  message: InboxMessage;
  /** Sent alongside so a thread the sidebar has never seen needs no extra fetch. */
  thread: InboxThread;
}

export interface InboxThreadUpdatedEvent {
  channel: string;
  threadId: string;
  thread: InboxThread;
}

export interface InboxMessageStatusEvent {
  channel: string;
  threadId: string;
  externalMessageId: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export class SocketServices {
  private socket: Socket = {} as Socket;

  public onChatMessage(): Observable<ChatMessage> {
    return fromEvent(this.socket, 'chat-message-bot');
  }

  /** A legacy live-chat reply was refused: another agent owns the chat (R7.2, R8.9). */
  public onChatMessageRejected(): Observable<{
    reason: string;
    ownerName?: string;
    message?: string;
    visitorId?: string;
    text?: string;
  }> {
    return fromEvent(this.socket, 'chat-message-rejected');
  }

  public onVisitorMessage(): Observable<ChatMessage> {
    return fromEvent(this.socket, 'message');
  }

  public onNewVisitor(): Observable<onNewVisitorAdded> {
    console.log('New Visitor Arrived');
    return fromEvent(this.socket, 'new-visitor');
  }
  /** The visitor of one of my active chats told the bot their name (R4.4). */
  public onVisitorUpdated(): Observable<{ conversationId: string; visitorId?: string; name: string }> {
    return fromEvent(this.socket, 'visitor-updated');
  }

  // ---------------------------------------------------------------------------
  // Omnichannel inbox (WhatsApp / Telegram / Instagram / …)
  //
  // Same transport and same `fromEvent` pattern as the widget events above —
  // these are extra event names on the existing `/socket.io/jarcube` connection,
  // not a second socket.
  // ---------------------------------------------------------------------------

  /** A message landed on a channel thread, either direction. */
  public onInboxMessage(): Observable<InboxMessageEvent> {
    return fromEvent(this.socket, 'inbox:message');
  }

  /** A thread's list state changed with no new message (read, takeover, …). */
  public onInboxThreadUpdated(): Observable<InboxThreadUpdatedEvent> {
    return fromEvent(this.socket, 'inbox:thread-updated');
  }

  /** The chat owner is typing (R8.6). */
  public onInboxAgentTyping(): Observable<{
    threadId?: string;
    conversationId?: string;
    visitorId: string;
    agentId: string;
    name: string;
  }> {
    return fromEvent(this.socket, 'inbox:agent-typing');
  }

  /** An org admin took a chat this user owned (R7.3). */
  public onInboxOwnershipOverridden(): Observable<{ threadId: string; actorId: string; actorName?: string; at: string }> {
    return fromEvent(this.socket, 'inbox:ownership-overridden');
  }

  /** Tell the other viewers (and the visitor) the owner is typing (R8.6). */
  public emitAgentTyping(visitorId: string, threadId?: string) {
    this.socket?.emit('agent-typing', { data: { visitorId, threadId } });
  }

  /** A delivery receipt advanced an outbound message's tick. */
  public onInboxMessageStatus(): Observable<InboxMessageStatusEvent> {
    return fromEvent(this.socket, 'inbox:message-status');
  }

  /**
   * The set of channels or their thread counts changed — refetch the tab list.
   *
   * Emitted when a chat-list sync created threads, which is how a conversation
   * that predates this process shows up without a page reload.
   */
  public onInboxChannelsChanged(): Observable<{ channel: string }> {
    return fromEvent(this.socket, 'inbox:channels-changed');
  }

  /**
   * A service request was created, moved, assigned, edited or commented on
   * (crm-plugins-service-desk R18). `data` is the card, null when it is gone.
   */
  public onServiceRequestChanged(): Observable<{
    kind: 'created' | 'updated' | 'moved' | 'assigned' | 'commented' | 'deleted';
    id: string;
    stageId: string | null;
    data: any | null;
  }> {
    return fromEvent(this.socket, 'crm:service-request');
  }

  // ---------------------------------------------------------------------------
  // Handover alerts — the only events that play the agent alert sound.
  // ---------------------------------------------------------------------------

  /** A visitor needs a human (flow transfer, intent, AI escalation, emergency). */
  public onHandoverRequested(): Observable<HandoverAlert> {
    return fromEvent(this.socket, 'inbox:handover-requested');
  }

  /** Someone opened/took over the thread, or the conversation ended. */
  public onHandoverAcknowledged(): Observable<HandoverAcknowledgedEvent> {
    return fromEvent(this.socket, 'inbox:handover-acknowledged');
  }

  /** This agent came online with pending alerts. */
  public onHandoverPending(): Observable<HandoverPendingEvent> {
    return fromEvent(this.socket, 'inbox:handover-pending');
  }

  public onConnect() {
    // console.log('onConnect', this.socket.id);
    return fromEvent(this.socket, 'connect');
  }

  /**
   * Fires on every successful reconnect (not the first connect).
   *
   * A socket gap is silent data loss for the inbox: messages that arrived while
   * the tab was disconnected were never emitted to it. Subscribers use this to
   * refetch, since nothing else would ever surface those messages.
   */
  public onReconnect() {
    return fromEvent(this.socket, 'reconnect');
  }

  public onDisconnect() {
    // console.log('onDisconnect');
    return fromEvent(this.socket, 'disconnect');
  }

  public disconnect() {
    this.socket.disconnect();
  }

  public sendMessage(event: string, data: unknown) {
    // console.log('sendMessage', event, data);
    this.socket.emit('events', data);
  }

  public reportChat(data: unknown) {
    // console.log('report conversation', data);
    this.socket.emit('report-conversation', data);
  }

  public endChat(data: unknown) {
    // console.log('end conversation', data);
    this.socket.emit('end-conversation', data);
  }

  public publish(data: unknown) {
    // console.log('publish', data);
    this.socket.emit('publish', data);
  }

  public sendTyping() {
    this.socket.emit('typing');
  }

  public sendStopTyping() {
    this.socket.emit('stop typing');
  }

  public refreshToken() {
    this.init();
  }

  public init(
    token: string = window.localStorage.getItem('accessToken') as string,
  ) {
    const url = env.baseurl;
    // console.log('init', this.socket.active);
    console.log('init', url);
    //this.socket.disconnect();
    this.socket = io(url, {
      path: '/socket.io/jarcube',
      auth: {
        token,
      },
    });

    return this.socket;
  }
}
