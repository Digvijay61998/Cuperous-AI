// ** React Imports
import { useEffect, useRef } from 'react';

// ** MUI Imports
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// ** Utils
import Icon from 'src/@core/components/icon';
import { InboxMessage } from 'src/services/socket.services';
import Audio from 'src/views/apps/components/Audio';
import Image from 'src/views/apps/components/Images';
import Message from 'src/views/apps/components/Message';
import Video from 'src/views/apps/components/Video';
import { ChannelCapabilities } from './channelConfig';

interface Props {
  messages: InboxMessage[];
  capabilities: ChannelCapabilities;
  loading: boolean;
  hasMore: boolean;
  onLoadOlder: () => void;
  historyExhausted: boolean;
  /** Offered per message where the channel supports quoted replies. */
  onReply?: (message: InboxMessage) => void;
  /** Resend a failed outbound message. */
  onRetry?: (message: InboxMessage) => void;
}

/**
 * Delivery tick for an outbound message.
 *
 * Rendered only where the channel actually reports receipts (see
 * ChannelCapabilities.deliveryTicks) — a permanently-single tick on a channel
 * with no receipts reads as "never delivered", which is worse than showing
 * nothing.
 */
const StatusTick = ({ status }: { status?: string }) => {
  if (!status) return null;

  if (status === 'failed') {
    return (
      <Icon
        icon="bx:error-circle"
        fontSize={14}
        style={{ color: '#ff4d49', marginLeft: 4 }}
      />
    );
  }
  if (status === 'pending') {
    return (
      <Icon
        icon="bx:time-five"
        fontSize={14}
        style={{ opacity: 0.5, marginLeft: 4 }}
      />
    );
  }
  // read is the only state that gets colour — that is the signal an agent looks
  // for, and colouring delivered too would make the two indistinguishable at a
  // glance.
  const isRead = status === 'read';
  const isDouble = status === 'delivered' || isRead;
  return (
    <Icon
      icon={isDouble ? 'bx:check-double' : 'bx:check'}
      fontSize={14}
      style={{
        marginLeft: 4,
        color: isRead ? '#53d769' : undefined,
        opacity: isRead ? 1 : 0.6,
      }}
    />
  );
};

/**
 * Attachment we hold a record of but not the bytes.
 *
 * Our engine deliberately does not download media (it records `mediaOmitted`), so
 * this is the normal case today, not an error state. Rendering it explicitly —
 * rather than as an empty bubble — is the convention OpenWA uses and the reason
 * their history is readable. Download-on-click arrives with the media phase.
 */
const OmittedMedia = ({
  isSender,
  fileName,
  type,
}: {
  isSender: boolean;
  fileName?: string;
  type: string;
}) => (
  <Box
    sx={{
      boxShadow: 1,
      borderRadius: 1,
      display: 'flex',
      alignItems: 'center',
      p: (theme) => theme.spacing(3, 4),
      ml: isSender ? 'auto' : undefined,
      maxWidth: '100%',
      color: isSender ? 'common.white' : 'text.primary',
      backgroundColor: isSender ? 'primary.main' : 'background.paper',
    }}
  >
    <Icon icon="bx:paperclip" fontSize={18} />
    <Typography sx={{ ml: 2, fontSize: '0.875rem' }}>
      {fileName || `${type} attachment`}
    </Typography>
  </Box>
);

const ThreadLog = ({
  messages,
  capabilities,
  loading,
  hasMore,
  onLoadOlder,
  historyExhausted,
  onReply,
  onRetry,
}: Props) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const lastIdRef = useRef<string | null>(null);

  /**
   * Autoscroll only when a NEW message arrives at the end.
   *
   * Keyed on the last message's identity rather than on `messages.length`: paging
   * older history also changes the length, and scrolling to the bottom then would
   * yank the agent away from the content they just asked to read.
   */
  useEffect(() => {
    const last = messages[messages.length - 1];
    const lastId = last ? last.externalMessageId ?? last.id : null;
    if (lastId && lastId !== lastIdRef.current) {
      lastIdRef.current = lastId;
      // Deferred so the new bubble is in the DOM before we measure.
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
    }
  }, [messages]);

  return (
    <Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', p: 5 }}>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        {loading ? <CircularProgress size={20} /> : null}

        {!loading && hasMore ? (
          <Typography
            variant="body2"
            onClick={onLoadOlder}
            sx={{ cursor: 'pointer', color: 'primary.main' }}
          >
            Load older messages
          </Typography>
        ) : null}

        {/* Only claim the beginning of the conversation when the channel has
            actually said so. Without this the UI would imply completeness it
            cannot verify. */}
        {!loading && !hasMore && historyExhausted ? (
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            Beginning of conversation
          </Typography>
        ) : null}
      </Box>

      {messages.map((msg) => {
        // `direction` is the authority, not the sender id: on a channel, a
        // message the operator typed on their own phone is outbound even though
        // its sender is neither our bot nor an agent.
        const isSender = msg.direction === 'outbound';
        const time = msg.time ? new Date(msg.time) : null;
        const hasOmittedMedia = !!msg.media && msg.media.omitted;
        const mediaUrl = msg.media?.url;

        return (
          <Box
            key={msg.externalMessageId ?? msg.id}
            sx={{
              mb: 3.5,
              display: 'flex',
              flexDirection: 'column',
              alignItems: isSender ? 'flex-end' : 'flex-start',
            }}
          >
            <Box sx={{ maxWidth: ['100%', '75%', '65%'], width: '100%' }}>
              {/* Group participant / contact name on inbound only — labelling our
                  own messages with our own name is noise. */}
              {!isSender && msg.authorName ? (
                <Typography
                  variant="caption"
                  sx={{ color: 'text.disabled', ml: 1 }}
                >
                  {msg.authorName}
                </Typography>
              ) : null}

              {capabilities.quotedReply && msg.quotedMessageId ? (
                <Box
                  sx={{
                    mb: 1,
                    pl: 2,
                    borderLeft: (t) => `3px solid ${t.palette.primary.main}`,
                    opacity: 0.7,
                  }}
                >
                  <Typography variant="caption">Replying to a message</Typography>
                </Box>
              ) : null}

              {hasOmittedMedia ? (
                <OmittedMedia
                  isSender={isSender}
                  fileName={msg.media?.fileName}
                  type={msg.type}
                />
              ) : msg.type === 'image' && mediaUrl ? (
                <Image isSender={isSender} image={mediaUrl} />
              ) : msg.type === 'video' && mediaUrl ? (
                <Video isSender={isSender} link={mediaUrl} type="mp4" />
              ) : msg.type === 'audio' && mediaUrl ? (
                <Audio isSender={isSender} link={mediaUrl} />
              ) : msg.message ? (
                <Message isSender={isSender} message={msg.message} />
              ) : null}

              <Box
                sx={{
                  mt: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isSender ? 'flex-end' : 'flex-start',
                }}
              >
                <Typography variant="caption">
                  {time
                    ? time.toLocaleString('en-US', {
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true,
                      })
                    : null}
                </Typography>
                {isSender && capabilities.deliveryTicks ? (
                  <StatusTick status={msg.status} />
                ) : null}

                {/* A failed reply is recoverable: the retry resends it under a
                    fresh correlation id, leaving this bubble as the failure
                    record. Shown regardless of deliveryTicks — a failure is worth
                    surfacing on every channel. */}
                {isSender && msg.status === 'failed' && onRetry ? (
                  <Tooltip title="Failed — tap to resend" placement="top">
                    <IconButton
                      size="small"
                      onClick={() => onRetry(msg)}
                      sx={{ ml: 0.5, p: 0.5, color: 'error.main' }}
                    >
                      <Icon icon="bx:refresh" fontSize={14} />
                    </IconButton>
                  </Tooltip>
                ) : null}

                {/* Quoting needs the channel-native id, which an optimistic row
                    does not have yet — so the action only appears once the
                    message is real on the channel. */}
                {capabilities.quotedReply &&
                onReply &&
                msg.externalMessageId ? (
                  <Tooltip title="Reply" placement="top">
                    <IconButton
                      size="small"
                      onClick={() => onReply(msg)}
                      sx={{ ml: 1, p: 0.5 }}
                    >
                      <Icon icon="bx:reply" fontSize={14} />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default ThreadLog;
