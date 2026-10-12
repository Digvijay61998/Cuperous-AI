// ** React Imports
import { KeyboardEvent, SyntheticEvent, useContext, useEffect, useRef, useState } from 'react';
import { ChatContext } from 'src/context/SocketContext';
import { shouldSendTyping } from './ownership';

// ** MUI Imports
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// ** Store & Actions
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { AppDispatch } from 'src/store';
import { inboxOptimisticSend, sendInboxMessage } from 'src/store/apps/inbox';

// ** Utils
import Icon from 'src/@core/components/icon';
import Axios from 'src/helper/Axios';
import { InboxMessage, InboxThread } from 'src/services/socket.services';
import { ChannelCapabilities } from './channelConfig';

interface Props {
  thread: InboxThread;
  capabilities: ChannelCapabilities;
  /** The signed-in user's id, stamped onto the optimistic row as its sender. */
  senderId: string;
  /** Set while the channel session is not connected — sending is refused. */
  disabledReason?: string;
  replyTo?: InboxMessage | null;
  onClearReply?: () => void;
  /** Send "owner is typing" signals (owner of a widget chat only). */
  canSignalTyping?: boolean;
}

/** Matches the caps the existing agent console applies. */
const MAX_VIDEO_BYTES = 4 * 1024 * 1024;
const MAX_OTHER_BYTES = 2 * 1024 * 1024;

/** Correlation id generator — namespaced and time-ordered for easy log tracing. */
const newCorrelationId = () =>
  `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const typeForFile = (file: File): string => {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  // Everything else goes as a document, which the channel's FILE branch handles.
  return 'file';
};

/**
 * The reply input for a channel thread.
 *
 * Sends optimistically: the bubble is appended locally before the request goes
 * out, then reconciled or marked failed by the thunk. That is what makes the
 * console feel immediate without lying about delivery — a failed send stays
 * visible as `failed` rather than disappearing.
 */
const ThreadComposer = ({
  thread,
  capabilities,
  senderId,
  disabledReason,
  replyTo,
  onClearReply,
  canSignalTyping,
}: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const chatContext: any = useContext(ChatContext);
  const [text, setText] = useState('');
  const [staged, setStaged] = useState<{
    url: string;
    type: string;
    mimetype: string;
    fileName: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);

  /**
   * Monotonic token guarding against a late upload landing on the wrong thread.
   *
   * An upload is async, so switching threads mid-upload would otherwise stage the
   * file against whichever thread is open when it resolves — and send a customer's
   * document to a different customer. Bumped on every new pick and on every thread
   * change, so a stale response is discarded.
   */
  const uploadSeq = useRef(0);

  // Leaving a thread must not carry a draft or an attachment into the next one.
  // Losing ownership does NOT clear the draft (R8.5): only the thread change does.
  const threadIdRef = useRef(thread.id);
  const lastTypingAt = useRef<number | null>(null);
  useEffect(() => {
    threadIdRef.current = thread.id;
    uploadSeq.current += 1;
    lastTypingAt.current = null;
    setText('');
    setStaged(null);
    setUploading(false);
  }, [thread.id]);

  const disabled = !!disabledReason;
  const canSubmit = !disabled && !uploading && (!!text.trim() || !!staged);

  // Throttled "owner is typing" signal (R8.6), widget chats only.
  const signalTyping = () => {
    if (!canSignalTyping || !thread.visitor?.id) return;
    const now = Date.now();
    if (!shouldSendTyping(lastTypingAt.current, now)) return;
    lastTypingAt.current = now;
    chatContext?.emitAgentTyping?.(thread.visitor.id, thread.id);
  };

  const handleFile = async (e: any) => {
    const file: File | undefined = e.target.files?.[0];
    // Reset the input so picking the same file twice still fires a change event.
    e.target.value = '';
    if (!file) return;

    const type = typeForFile(file);
    const cap = type === 'video' ? MAX_VIDEO_BYTES : MAX_OTHER_BYTES;
    if (file.size > cap) {
      toast.error(
        `${file.name} is too large — the limit is ${Math.round(cap / 1024 / 1024)}MB`,
      );
      return;
    }

    const mySeq = ++uploadSeq.current;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res: any = await Axios.post('/file', form);

      // A newer pick, or a thread switch, happened while this was in flight.
      if (uploadSeq.current !== mySeq) return;

      const url: string = res.data?.url;
      if (!url) {
        toast.error('Upload did not return a file URL');
        return;
      }
      setStaged({
        // The channel fetches this URL server-side, so it must be absolute.
        url: /^https?:\/\//i.test(url)
          ? url
          : `${Axios.defaults.baseURL}${url.startsWith('/') ? '' : '/'}${url}`,
        type,
        mimetype: file.type,
        fileName: file.name,
      });
    } catch (error: any) {
      if (uploadSeq.current !== mySeq) return;
      toast.error(
        error?.response?.data?.message || error?.message || 'Upload failed',
      );
    } finally {
      if (uploadSeq.current === mySeq) setUploading(false);
    }
  };

  const handleSubmit = (e?: SyntheticEvent) => {
    e?.preventDefault();
    if (!canSubmit) return;

    const message = text.trim();
    const correlationId = newCorrelationId();
    // Captured before clearing, so the request carries what the agent typed even
    // though the input is emptied immediately.
    const attachment = staged;
    const quotedMessageId = replyTo?.externalMessageId;

    dispatch(
      inboxOptimisticSend({
        threadId: thread.id,
        correlationId,
        message,
        type: attachment?.type || 'text',
        mediaUrl: attachment?.url,
        mimetype: attachment?.mimetype,
        fileName: attachment?.fileName,
        quotedMessageId,
        senderId,
      }),
    );

    setText('');
    setStaged(null);
    onClearReply?.();

    const sentOn = thread.id;
    dispatch(
      sendInboxMessage({
        threadId: thread.id,
        correlationId,
        message: message || undefined,
        type: attachment?.type || 'text',
        mediaUrl: attachment?.url,
        mimetype: attachment?.mimetype,
        fileName: attachment?.fileName,
        quotedMessageId,
      }),
    ).then((res: any) => {
      // Not the owner any more (R8.9): nothing was sent, so give the agent
      // their text back (unless they already typed something new).
      if (res?.payload?.reason === 'not_thread_owner' && threadIdRef.current === sentOn) {
        setText((current) => current || message);
        if (attachment) setStaged((current) => current || attachment);
      }
    });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Enter sends, Shift+Enter is a newline — the convention every chat client uses.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ borderTop: (t) => `1px solid ${t.palette.divider}` }}
    >
      {replyTo ? (
        <Box
          sx={{
            px: 5,
            pt: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box
            sx={{
              pl: 2,
              minWidth: 0,
              borderLeft: (t) => `3px solid ${t.palette.primary.main}`,
            }}
          >
            <Typography variant="caption" sx={{ color: 'primary.main' }}>
              Replying to
            </Typography>
            <Typography variant="body2" noWrap sx={{ opacity: 0.8 }}>
              {replyTo.message || `[${replyTo.type}]`}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClearReply}>
            <Icon icon="bx:x" fontSize={18} />
          </IconButton>
        </Box>
      ) : null}

      {staged ? (
        <Box
          sx={{ px: 5, pt: 2, display: 'flex', alignItems: 'center', gap: 2 }}
        >
          <Icon icon="bx:paperclip" fontSize={16} />
          <Typography variant="body2" noWrap sx={{ flex: 1 }}>
            {staged.fileName}
          </Typography>
          <IconButton size="small" onClick={() => setStaged(null)}>
            <Icon icon="bx:x" fontSize={18} />
          </IconButton>
        </Box>
      ) : null}

      <Box sx={{ px: 5, py: 3, display: 'flex', alignItems: 'flex-end', gap: 2 }}>
        {capabilities.media ? (
          <Tooltip title="Attach a file" placement="top">
            <IconButton component="label" size="small" disabled={disabled || uploading}>
              <Icon icon="bx:paperclip" fontSize={20} />
              <input hidden type="file" onChange={handleFile} />
            </IconButton>
          </Tooltip>
        ) : null}

        <TextField
          fullWidth
          multiline
          maxRows={5}
          size="small"
          value={text}
          disabled={disabled}
          onChange={(e) => {
            setText(e.target.value);
            if (e.target.value) signalTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder={
            disabledReason || 'Type a reply... (Enter to send, Shift+Enter for a new line)'
          }
        />

        <Tooltip title={disabledReason || 'Send'} placement="top">
          <span>
            <IconButton color="primary" type="submit" disabled={!canSubmit}>
              <Icon
                icon={uploading ? 'bx:loader-alt' : 'bx:send'}
                fontSize={20}
              />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default ThreadComposer;
