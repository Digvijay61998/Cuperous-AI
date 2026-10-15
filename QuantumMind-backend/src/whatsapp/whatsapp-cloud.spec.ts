import { parseCloudWebhook } from './whatsapp-cloud-webhook.parser';
import { WhatsappService, WA_CLOUD_CHANNEL } from './whatsapp.service';
import { WhatsappCloudApiError } from './whatsapp-cloud.client';

const WABA = '1122334455';
const PNID = '998877';
const FROM = '919812345678';

const webhook = (messages: any[] = [], statuses: any[] = []) => ({
  object: 'whatsapp_business_account',
  entry: [
    {
      id: WABA,
      changes: [
        {
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: { phone_number_id: PNID, display_phone_number: '+91 20 0000 0000' },
            contacts: [{ wa_id: FROM, profile: { name: 'Asha' } }],
            messages,
            statuses,
          },
        },
      ],
    },
  ],
});

const textMsg = (id = 'wamid.A1', body = 'Hi, I need an appointment') => ({
  from: FROM,
  id,
  timestamp: '1760000000',
  type: 'text',
  text: { body },
});

describe('parseCloudWebhook', () => {
  it('reads every message and status in a batched payload', () => {
    const body = webhook(
      [textMsg('wamid.1'), textMsg('wamid.2', 'second')],
      [{ id: 'wamid.out', status: 'delivered', timestamp: '1760000001', recipient_id: FROM }],
    );
    const out = parseCloudWebhook(body);
    expect(out.messages.map((m) => m.messageId)).toEqual(['wamid.1', 'wamid.2']);
    expect(out.messages[0]).toMatchObject({
      wabaId: WABA,
      phoneNumberId: PNID,
      from: FROM,
      profileName: 'Asha',
      type: 'text',
      text: 'Hi, I need an appointment',
    });
    expect(out.statuses).toEqual([
      expect.objectContaining({ messageId: 'wamid.out', status: 'delivered' }),
    ]);
  });

  it('shows a button reply by title but feeds the flow its id (the option value)', () => {
    const out = parseCloudWebhook(
      webhook([
        {
          from: FROM,
          id: 'wamid.B',
          type: 'interactive',
          interactive: { type: 'button_reply', button_reply: { id: 'book_appt', title: 'Book appointment' } },
        },
      ]),
    );
    expect(out.messages[0]).toMatchObject({ text: 'Book appointment', botInput: 'book_appt' });
  });

  it('keeps media as an id to fetch, with the caption as text', () => {
    const out = parseCloudWebhook(
      webhook([
        {
          from: FROM,
          id: 'wamid.I',
          type: 'image',
          image: { id: 'media-1', mime_type: 'image/jpeg', caption: 'my report' },
        },
      ]),
    );
    expect(out.messages[0]).toMatchObject({
      type: 'image',
      text: 'my report',
      media: { id: 'media-1', mimetype: 'image/jpeg' },
    });
  });

  it('stores reactions without feeding the bot', () => {
    const out = parseCloudWebhook(
      webhook([{ from: FROM, id: 'wamid.R', type: 'reaction', reaction: { message_id: 'wamid.X', emoji: '👍' } }]),
    );
    expect(out.messages[0]).toMatchObject({ storeOnly: true, quotedMessageId: 'wamid.X' });
  });

  it('ignores payloads that are not WhatsApp', () => {
    expect(parseCloudWebhook({ object: 'page' })).toEqual({ messages: [], statuses: [] });
    expect(parseCloudWebhook(undefined)).toEqual({ messages: [], statuses: [] });
  });
});

function makeHub(overrides: { thread?: any; created?: boolean; sendError?: any } = {}) {
  const thread: any = {
    _id: 'thread-1',
    bot: 'bot-1',
    sessionName: WABA,
    chatId: FROM,
    phone: FROM,
    botEnabled: true,
    handledByAgent: false,
    meta: { phoneNumberId: PNID, lastInboundAt: new Date() },
    ...(overrides.thread ?? {}),
  };
  const state: Record<string, any> = {};
  const socialService: any = {
    getChannelCredentials: jest.fn(async () => ({
      accountId: WABA,
      accessToken: 'token',
      phoneNumberId: PNID,
      jarcubeBotId: 'bot-1',
      name: 'Clinic',
      status: 'published',
    })),
    listChannelAccounts: jest.fn(async () => [{ accountId: WABA, name: 'Clinic', status: 'published' }]),
  };
  const chatInitializer: any = {
    initializeChat: jest.fn(async () => {
      state['visitor-1'] = { conversationId: 'conv-1', currentNode: { id: 'n' } };
      return { visitorId: 'visitor-1' };
    }),
  };
  const messageHandler: any = {
    handleMessage: jest.fn(async () => undefined),
    sendMessageToAgent: jest.fn(),
  };
  const socketState: any = {
    getUserData: jest.fn((id: string) => state[id]),
    updateUserData: jest.fn((id: string, d: any) => {
      state[id] = { ...(state[id] || {}), ...d };
    }),
  };
  const conversation: any = {
    saveChannelMessage: jest.fn(async (dto: any) => ({
      chat: { _id: 'chat-1', ...dto },
      created: overrides.created ?? true,
    })),
    getConversationStatus: jest.fn(async () => 'in_progress'),
    linkOutboundChannelMessage: jest.fn(async (p: any) => ({ _id: 'chat-out', ...p })),
    failOutboundByCorrelationId: jest.fn(async () => ({ _id: 'chat-out' })),
    advanceChannelMessageStatus: jest.fn(async (id: string, status: string) => ({
      channelThread: 'thread-1',
      status,
    })),
  };
  const channelThread: any = {
    upsertForInbound: jest.fn(async () => thread),
    attachConversation: jest.fn(async () => undefined),
    touchLastMessage: jest.fn(async () => undefined),
    findByIdPopulated: jest.fn(async () => thread),
    findById: jest.fn(async () => thread),
    findByKey: jest.fn(async () => thread),
    getReplyTargetByVisitor: jest.fn(async () => ({
      threadId: 'thread-1',
      channel: WA_CLOUD_CHANNEL,
      sessionName: WABA,
      chatId: FROM,
      phone: FROM,
    })),
  };
  const inboxEvents: any = {
    publishMessage: jest.fn(async () => undefined),
    publishMessageStatus: jest.fn(async () => undefined),
    publishChannelsChanged: jest.fn(async () => undefined),
  };
  const cloud: any = {
    maxMediaBytes: 1000,
    sendMessage: jest.fn(async () => {
      if (overrides.sendError) throw overrides.sendError;
      return 'wamid.OUT';
    }),
    markRead: jest.fn(async () => undefined),
    getMediaInfo: jest.fn(),
    downloadMedia: jest.fn(),
  };
  const config: any = { get: jest.fn(() => undefined) };
  const upload: any = { uploadFile: jest.fn() };
  const hub = new WhatsappService(
    config,
    socialService,
    chatInitializer,
    messageHandler,
    socketState,
    conversation,
    channelThread,
    inboxEvents,
    cloud,
    upload,
  );
  return { hub, thread, state, messageHandler, conversation, channelThread, inboxEvents, cloud };
}

describe('WhatsappService (Cloud API hub)', () => {
  it('inbound: creates the inbox thread, stores, announces, then runs the bot', async () => {
    const h = makeHub();
    await h.hub.handleWebhook(webhook([textMsg()]));

    expect(h.channelThread.upsertForInbound).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'whatsapp', sessionName: WABA, chatId: FROM, bot: 'bot-1' }),
    );
    expect(h.conversation.saveChannelMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: 'conv-1',
        channelThread: 'thread-1',
        externalMessageId: 'wamid.A1',
        direction: 'inbound',
      }),
    );
    expect(h.inboxEvents.publishMessage).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'whatsapp', threadId: 'thread-1' }),
    );
    expect(h.messageHandler.handleMessage).toHaveBeenCalledWith(
      'Hi, I need an appointment',
      expect.anything(),
      'text',
      'en',
      expect.objectContaining({
        whatsappCloud: expect.objectContaining({ accountId: WABA, recipient: FROM, threadId: 'thread-1' }),
      }),
    );
  });

  it('inbound: a Meta retry (duplicate wamid) is neither announced nor answered', async () => {
    const h = makeHub({ created: false });
    await h.hub.handleWebhook(webhook([textMsg()]));
    expect(h.inboxEvents.publishMessage).not.toHaveBeenCalled();
    expect(h.messageHandler.handleMessage).not.toHaveBeenCalled();
  });

  it('inbound: a thread an agent took over goes to the agent, not the bot', async () => {
    const h = makeHub({ thread: { handledByAgent: true, assignedAgent: 'agent-7' } });
    await h.hub.handleWebhook(webhook([textMsg()]));
    expect(h.messageHandler.sendMessageToAgent).toHaveBeenCalledWith(
      'agent-7',
      expect.objectContaining({ value: 'Hi, I need an appointment' }),
      expect.anything(),
    );
    expect(h.messageHandler.handleMessage).not.toHaveBeenCalled();
  });

  it('agent reply: delivered with the stored number id and returns the wamid', async () => {
    const h = makeHub();
    const res = await h.hub.onInboxSendMessage({
      channel: 'whatsapp',
      sessionName: WABA,
      chatId: FROM,
      threadId: 'thread-1',
      correlationId: 'c1',
      type: 'text',
      message: 'Your appointment is confirmed',
    });
    expect(res).toMatchObject({ accepted: true, externalMessageId: 'wamid.OUT' });
    expect(h.cloud.sendMessage).toHaveBeenCalledWith(
      { accessToken: 'token', phoneNumberId: PNID },
      FROM,
      expect.objectContaining({ type: 'text', text: expect.objectContaining({ body: 'Your appointment is confirmed' }) }),
      undefined,
    );
  });

  it('agent reply: other channels are not ours', async () => {
    const h = makeHub();
    expect(await h.hub.onInboxSendMessage({ channel: 'whatsapp_web' } as any)).toBeNull();
  });

  it('agent reply: refused with a clear reason outside the 24h window', async () => {
    const h = makeHub({
      thread: { meta: { phoneNumberId: PNID, lastInboundAt: new Date(Date.now() - 25 * 3600 * 1000) } },
    });
    const res = await h.hub.onInboxSendMessage({
      channel: 'whatsapp',
      sessionName: WABA,
      chatId: FROM,
      threadId: 'thread-1',
      correlationId: 'c1',
      type: 'text',
      message: 'hello',
    });
    expect(res).toMatchObject({ accepted: false, reason: 'outside_service_window' });
    expect(h.cloud.sendMessage).not.toHaveBeenCalled();
  });

  it('agent reply: Meta error 131047 maps to outside_service_window', async () => {
    const h = makeHub({ sendError: new WhatsappCloudApiError('Re-engagement message', 131047, 400) });
    const res = await h.hub.onInboxSendMessage({
      channel: 'whatsapp',
      sessionName: WABA,
      chatId: FROM,
      threadId: 'thread-1',
      correlationId: 'c1',
      type: 'text',
      message: 'hello',
    });
    expect(res).toMatchObject({ accepted: false, reason: 'outside_service_window' });
  });

  it('bot reply after a restart: address comes from the thread, buttons go out as native buttons', async () => {
    const h = makeHub();
    await h.hub.onSend({
      userId: 'visitor-1',
      ctx: undefined,
      message: {
        id: 'msg-1',
        type: 'buttons',
        value: 'How can we help?',
        buttons: [
          { title: 'Book appointment', value: 'book' },
          { title: 'Talk to staff', value: 'agent' },
        ],
      },
    });
    expect(h.cloud.sendMessage).toHaveBeenCalledWith(
      { accessToken: 'token', phoneNumberId: PNID },
      FROM,
      expect.objectContaining({
        type: 'interactive',
        interactive: expect.objectContaining({
          type: 'button',
          action: {
            buttons: [
              { type: 'reply', reply: { id: 'book', title: 'Book appointment' } },
              { type: 'reply', reply: { id: 'agent', title: 'Talk to staff' } },
            ],
          },
        }),
      }),
      undefined,
    );
    expect(h.conversation.linkOutboundChannelMessage).toHaveBeenCalledWith(
      expect.objectContaining({ correlationId: 'msg-1', threadId: 'thread-1', externalMessageId: 'wamid.OUT' }),
    );
    expect(h.inboxEvents.publishMessage).toHaveBeenCalled();
  });

  it('bot reply failure marks the row failed instead of leaving it pending', async () => {
    const h = makeHub({ sendError: new Error('boom') });
    await h.hub.onSend({ userId: 'visitor-1', message: { id: 'msg-2', type: 'text', value: 'hi' } });
    expect(h.conversation.failOutboundByCorrelationId).toHaveBeenCalledWith('msg-2');
    expect(h.inboxEvents.publishMessageStatus).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed', externalMessageId: 'msg-2' }),
    );
  });

  it('delivery receipts advance the tick and are broadcast', async () => {
    const h = makeHub();
    await h.hub.handleWebhook(
      webhook([], [{ id: 'wamid.OUT', status: 'read', timestamp: '1760000002', recipient_id: FROM }]),
    );
    expect(h.conversation.advanceChannelMessageStatus).toHaveBeenCalledWith('wamid.OUT', 'read');
    expect(h.inboxEvents.publishMessageStatus).toHaveBeenCalledWith(
      expect.objectContaining({ channel: 'whatsapp', status: 'read' }),
    );
  });

  it('channel status: connected when a Cloud messenger exists, removed when none', async () => {
    const h = makeHub();
    expect(await h.hub.onInboxChannelStatus({ channel: 'whatsapp' })).toMatchObject({
      state: 'connected',
      connected: true,
    });
    expect(await h.hub.onInboxChannelStatus({ channel: 'telegram' })).toBeNull();
  });

  it('webhook signature: enforced only when an app secret is configured', () => {
    const h = makeHub();
    expect(h.hub.verifySignature(undefined, undefined)).toBe(true);
    const secured = new WhatsappService(
      { get: () => 'shh' } as any,
      ...([{}, {}, {}, {}, {}, {}, {}, {}, {}] as [any, any, any, any, any, any, any, any, any]),
    );
    const body = Buffer.from('{"a":1}');
    const sig =
      'sha256=' + require('crypto').createHmac('sha256', 'shh').update(body).digest('hex');
    expect(secured.verifySignature(body, sig)).toBe(true);
    expect(secured.verifySignature(body, 'sha256=00')).toBe(false);
    expect(secured.verifySignature(undefined, sig)).toBe(false);
  });
});
