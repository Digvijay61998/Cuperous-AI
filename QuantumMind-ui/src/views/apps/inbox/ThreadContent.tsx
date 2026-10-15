// ** MUI Imports
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// ** React Imports
import { useEffect, useState } from 'react';

// ** Store & Actions
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import {
  getInboxMessages,
  inboxExpirePending,
  requestInboxHistory,
  retryInboxMessage,
  setInboxBotControl,
  overrideInboxOwner,
} from 'src/store/apps/inbox';
import OwnershipControls from './OwnershipControls';
import { ownershipView } from './ownership';

// ** Utils
import Icon from 'src/@core/components/icon';
import CustomAvatar from 'src/@core/components/mui/avatar';
import { getInitials } from 'src/@core/utils/get-initials';
import returnPlatformIcon from 'src/components/PlatforomIcons';
import { InboxMessage } from 'src/services/socket.services';
import { capabilitiesFor, channelLabel } from './channelConfig';
import { contactInitialsSource, contactSubtitle } from './contactDisplay';
import ThreadComposer from './ThreadComposer';
import ThreadLog from './ThreadLog';
import { setOpenChat } from 'src/services/alerts/chatViewport';
import ConversationContactBadge from 'src/views/crm/ConversationContactBadge';
import VisitorProfilePanel from 'src/views/crm/VisitorProfilePanel';
import { WIDGET_CHANNEL } from 'src/views/crm/contactLinks';
import SrWrapUpDialog from 'src/views/crm/service-requests/SrWrapUpDialog';

interface Props {
  channel: string;
}

/**
 * The message pane for one channel thread: header + log.
 *
 * No composer yet — sending is Phase 4. The read path is deliberately shipped
 * first so an agent can see WhatsApp conversations (which today are invisible
 * entirely) before the reply path is wired.
 */
const ThreadContent = ({ channel }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    selectedThreadId,
    threadsByChannel,
    messagesByThread,
    messageCursorByThread,
    hasMoreByThread,
    loadingMessages,
    messagesErrorByThread,
  } = useSelector((state: RootState) => state.inbox);

  // Stamped onto the optimistic row as its sender so the bubble aligns right
  // before the server has confirmed anything.
  const senderId = useSelector(
    (state: RootState) => (state.user as any)?.userData?._id || 'agent',
  );

  const capabilities = capabilitiesFor(channel);
  const threads = threadsByChannel[channel] || [];
  const thread = threads.find((t) => t.id === selectedThreadId);
  // The conversation the CRM contact, ticket and visitor profile hang off.
  // Widget threads are keyed by it (chatId); channel threads (WhatsApp Web,
  // WhatsApp Cloud API, ...) carry their current one separately.
  const contactConversationId =
    channel === WIDGET_CHANNEL ? thread?.chatId : thread?.conversationId;

  // Ownership matrix (R8.1–R8.3). Recomputed on every thread-updated event.
  const userRole = useSelector((state: RootState) => (state.user as any)?.userData?.role);
  const ownership = ownershipView({
    handledByAgent: thread?.handledByAgent,
    assignedAgent: thread?.assignedAgent as any,
    meId: senderId,
    isOrgAdmin: userRole === 'org_admin',
  });
  const typingByKey = useSelector((state: RootState) => state.inbox.typingByKey);
  const typing = (thread && (typingByKey[thread.id] || (thread.chatId && typingByKey[thread.chatId]))) || null;

  const [controlBusy, setControlBusy] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const runControl = async (action: 'takeover' | 'release') => {
    if (!thread) return;
    setControlBusy(true);
    try {
      await dispatch(setInboxBotControl({ threadId: thread.id, action }));
    } finally {
      setControlBusy(false);
    }
  };

  // The message the composer is quoting, if any. Held here rather than in the
  // composer because the composer unmounts when the thread closes, which would
  // silently discard the selection.
  const [replyTo, setReplyTo] = useState<InboxMessage | null>(null);

  // Cleared on thread change so a quote never leaks into a different conversation.
  useEffect(() => {
    setReplyTo(null);
  }, [selectedThreadId]);

  // Tell the alert client which thread this tab is showing (and clear on close),
  // so a visitor message here does not notify while the agent is reading it.
  useEffect(() => {
    setOpenChat(selectedThreadId);
    return () => setOpenChat(null);
  }, [selectedThreadId]);

  /**
   * Age out replies stuck `pending`.
   *
   * A dropped request resolves neither the thunk nor an echo, so without this a
   * bubble would sit `pending` forever. The interval only runs while something is
   * actually pending, so an idle thread costs nothing.
   */
  const hasPending = (messagesByThread[selectedThreadId || ''] || []).some(
    (m) => m.optimistic && m.status === 'pending',
  );

  useEffect(() => {
    if (!hasPending || !selectedThreadId) return;
    const timer = setInterval(
      () => dispatch(inboxExpirePending({ threadId: selectedThreadId })),
      5000,
    );
    return () => clearInterval(timer);
  }, [hasPending, selectedThreadId, dispatch]);

  /**
   * Fetch the open thread's messages whenever we hold no cached list for it.
   *
   * This covers two cases with one rule: first open (the list has never been
   * loaded), and recovery after a socket gap (`inboxSocketGap` cleared the cache
   * precisely so this refetches). `undefined` means "never loaded" while `[]`
   * means "loaded and genuinely empty" — collapsing the two would refetch an
   * empty thread on every render.
   *
   * Declared before the early return below: hooks must run on every render.
   */
  const cachedMessages = selectedThreadId
    ? messagesByThread[selectedThreadId]
    : undefined;

  useEffect(() => {
    // After a failure, wait for Retry instead of re-requesting on every render.
    if (selectedThreadId && cachedMessages === undefined && !messagesErrorByThread?.[selectedThreadId]) {
      dispatch(getInboxMessages({ threadId: selectedThreadId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedThreadId, cachedMessages === undefined]);

  if (!thread) {
    return (
      <Box
        sx={{
          flex: 1,
          height: '65vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          backgroundColor: 'background.paper',
          borderRadius: 1,
          boxShadow:
            'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px',
        }}
      >
        <CustomAvatar
          skin="light"
          color="primary"
          sx={{ width: 60, height: 60, mb: 3 }}
        >
          {returnPlatformIcon(channel)}
        </CustomAvatar>
        <Typography sx={{ color: 'text.secondary' }}>
          Select a conversation
        </Typography>
      </Box>
    );
  }

  const messages = messagesByThread[thread.id];
  const cursor = messageCursorByThread[thread.id] || null;
  const hasMore = !!hasMoreByThread[thread.id];
  const historyFailed = !!messagesErrorByThread?.[thread.id] && messages === undefined;

  /**
   * Load older messages.
   *
   * Two-stage, and the order matters: page from our own database first, and only
   * ask the channel for more once we have exhausted what we already hold. Asking
   * the channel first would pay a network round trip (and, on WhatsApp, a
   * rate-limit/ban budget) for messages sitting in our own DB.
   */
  const handleLoadOlder = async () => {
    if (cursor) {
      dispatch(getInboxMessages({ threadId: thread.id, before: cursor }));
      return;
    }

    if (!capabilities.history || thread.historyExhausted) return;

    const result: any = await dispatch(requestInboxHistory(thread.id));
    const reason = result?.payload?.reason;
    if (result?.payload?.requested) {
      // The channel answers asynchronously (WhatsApp replies on its own history
      // event), so there is nothing to render yet — say so rather than leaving
      // the click looking like it did nothing.
      toast.success('Fetching older messages from the channel...');
    } else if (reason === 'cooldown') {
      toast('Please wait a moment before requesting more history');
    } else if (reason === 'history_exhausted') {
      toast('No older messages available');
    }
  };

  return (
    <Box
      sx={{
        flex: 1,
        height: '65vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: 'background.paper',
        borderRadius: 1,
        boxShadow:
          'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px',
      }}
    >
      <Box
        sx={{
          px: 5,
          py: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CustomAvatar
            skin="light"
            color="primary"
            src={thread.avatarUrl || undefined}
            sx={{ width: 38, height: 38, mr: 3, fontSize: '0.875rem' }}
          >
            {/* Same rule as the sidebar row: initials only for a real name. */}
            {contactInitialsSource(thread) ? (
              getInitials(contactInitialsSource(thread) as string)
            ) : (
              <Icon icon="mdi:account" fontSize={20} />
            )}
          </CustomAvatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                {thread.name}
              </Typography>
              <Tooltip title={channelLabel(channel)} placement="top" arrow>
                <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
                  {returnPlatformIcon(channel)}
                </Box>
              </Tooltip>
              {/* CRM contact for every channel: WhatsApp contacts are captured
                  into the CRM on their first message, like widget visitors. */}
              {contactConversationId && (
                <ConversationContactBadge conversationId={contactConversationId} />
              )}
            </Box>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {/* `contactSubtitle` is empty when the heading above already IS the
                  phone number, so a nameless contact no longer shows it twice.
                  Falls back to the bot name alone, with no orphaned separator. */}
              {[contactSubtitle(thread), thread.bot?.name]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* The thread's own flags are the authority (they survive a restart). */}
          {ownership.kind === 'bot' && (
            <Chip
              size="small"
              label={thread.botEnabled ? 'Bot active' : 'Bot paused'}
              color={thread.botEnabled ? 'info' : 'warning'}
              variant="outlined"
            />
          )}
          <Tooltip title="Create or update the service request for this chat" arrow>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Icon icon="fontisto:ticket" fontSize={14} />}
              onClick={() => setTicketOpen(true)}
            >
              Create ticket
            </Button>
          </Tooltip>
          <OwnershipControls
            view={ownership}
            canControl={!!capabilities.botToggle}
            busy={controlBusy}
            typing={typing}
            onTakeover={() => runControl('takeover')}
            // Taking over a bot reply and handing it back needs no ticket;
            // "Create ticket" next to it is the agent's choice.
            onRelease={() => runControl('release')}
            onOverride={async () => {
              const res: any = await dispatch(overrideInboxOwner({ threadId: thread.id }));
              if (res?.error) throw new Error(res?.payload?.message || 'The override did not complete.');
            }}
          />
        </Box>
      </Box>

      <SrWrapUpDialog
        open={ticketOpen}
        mode="save"
        threadId={thread.id}
        conversationId={contactConversationId}
        onCancel={() => setTicketOpen(false)}
        onSaved={() => setTicketOpen(false)}
      />
      {/* R9.10: never show a failed load as an empty conversation. The
          composer below stays mounted, so unsent text is kept. */}
      {historyFailed && (
        <Alert
          severity="error"
          sx={{ mx: 5, mt: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => dispatch(getInboxMessages({ threadId: thread.id }))}>
              Retry
            </Button>
          }
        >
          The conversation history could not be loaded.
        </Alert>
      )}
      {/* R18.8: the profile replaces earlier transcripts. Widget threads only:
          they are keyed by one conversation id; channel threads use their
          current conversation. */}
      {contactConversationId && (
        <Box sx={{ mx: 5, mt: 3 }}>
          <VisitorProfilePanel conversationId={contactConversationId} />
        </Box>
      )}

      <ThreadLog
        messages={messages || []}
        capabilities={capabilities}
        loading={loadingMessages}
        hasMore={hasMore || (capabilities.history && !thread.historyExhausted)}
        onLoadOlder={handleLoadOlder}
        historyExhausted={thread.historyExhausted}
        onReply={setReplyTo}
        onRetry={(m) =>
          m.correlationId &&
          dispatch(
            retryInboxMessage({
              threadId: thread.id,
              failedCorrelationId: m.correlationId,
              senderId,
            }),
          )
        }
      />

      <ThreadComposer
        thread={thread}
        capabilities={capabilities}
        senderId={senderId}
        disabledReason={ownership.composerDisabledReason || undefined}
        canSignalTyping={ownership.kind === 'mine' && channel === WIDGET_CHANNEL}
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
      />
    </Box>
  );
};

export default ThreadContent;
