// ** MUI Imports
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
} from 'src/store/apps/inbox';

// ** Utils
import CustomAvatar from 'src/@core/components/mui/avatar';
import { getInitials } from 'src/@core/utils/get-initials';
import returnPlatformIcon from 'src/components/PlatforomIcons';
import { InboxMessage } from 'src/services/socket.services';
import { capabilitiesFor } from './channelConfig';
import ThreadComposer from './ThreadComposer';
import ThreadLog from './ThreadLog';

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
  } = useSelector((state: RootState) => state.inbox);

  // Stamped onto the optimistic row as its sender so the bubble aligns right
  // before the server has confirmed anything.
  const senderId = useSelector(
    (state: RootState) => (state.user as any)?.userData?._id || 'agent',
  );

  const capabilities = capabilitiesFor(channel);
  const threads = threadsByChannel[channel] || [];
  const thread = threads.find((t) => t.id === selectedThreadId);

  // The message the composer is quoting, if any. Held here rather than in the
  // composer because the composer unmounts when the thread closes, which would
  // silently discard the selection.
  const [replyTo, setReplyTo] = useState<InboxMessage | null>(null);

  // Cleared on thread change so a quote never leaks into a different conversation.
  useEffect(() => {
    setReplyTo(null);
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
    if (selectedThreadId && cachedMessages === undefined) {
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
            {thread.name ? getInitials(thread.name) : null}
          </CustomAvatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                {thread.name}
              </Typography>
              <Tooltip title={channel} placement="top" arrow>
                <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
                  {returnPlatformIcon(channel)}
                </Box>
              </Tooltip>
            </Box>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {thread.phone || thread.chatId}
              {thread.bot?.name ? ` · ${thread.bot.name}` : ''}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Who is answering right now. The thread's own flags are the authority
              (they survive a restart), which is why this is read from the thread
              rather than inferred from the conversation. */}
          <Chip
            size="small"
            label={
              thread.handledByAgent
                ? `Agent${
                    thread.assignedAgent?.name
                      ? `: ${thread.assignedAgent.name}`
                      : ''
                  }`
                : thread.botEnabled
                ? 'Bot active'
                : 'Bot paused'
            }
            color={
              thread.handledByAgent
                ? 'success'
                : thread.botEnabled
                ? 'info'
                : 'warning'
            }
            variant="outlined"
          />

          {/* Takeover is reversible, which is the whole point: an agent steps in
              for one exchange and hands the thread back, without touching the
              bot's behaviour on any other conversation. */}
          {capabilities.botToggle ? (
            <Tooltip
              title={
                thread.handledByAgent
                  ? 'Hand this conversation back to the bot'
                  : 'Take this conversation over from the bot'
              }
              placement="top"
            >
              <Button
                size="small"
                variant="outlined"
                color={thread.handledByAgent ? 'warning' : 'primary'}
                onClick={() =>
                  dispatch(
                    setInboxBotControl({
                      threadId: thread.id,
                      action: thread.handledByAgent ? 'release' : 'takeover',
                    }),
                  )
                }
              >
                {thread.handledByAgent ? 'Release to bot' : 'Take over'}
              </Button>
            </Tooltip>
          ) : null}
        </Box>
      </Box>

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
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
      />
    </Box>
  );
};

export default ThreadContent;
