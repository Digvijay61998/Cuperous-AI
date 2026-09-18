// ** React Imports
import { useEffect } from 'react';

// ** Next Imports
import { useRouter } from 'next/router';

// ** MUI Imports
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

// ** Store & Actions
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import {
  getInboxChannelStatus,
  InboxChannelState,
} from 'src/store/apps/inbox';

// ** Utils
import { channelLabel } from './channelConfig';

interface Props {
  channel: string;
}

/** Where an operator goes to fix any of this. */
const SOCIAL_MESSENGERS_ROUTE = '/social/list';

/**
 * How often to re-probe while a channel is unhealthy.
 *
 * Only while unhealthy: a connected channel is left alone, because a reconnect
 * publishes its own socket events and polling a working channel is pure waste. An
 * unhealthy one has no such event to wait for — the operator fixes it on ANOTHER
 * page (or on their phone), and this poll is the only way the banner learns that
 * they did.
 */
const UNHEALTHY_POLL_MS = 20 * 1000;

interface Presentation {
  severity: 'error' | 'warning' | 'info';
  title: string;
  body: string;
  /** Omitted where the Social Messengers page cannot help. */
  action?: string;
}

/**
 * What each state means to the person reading it, and what they should do.
 *
 * Written as instructions, not diagnoses: an agent who sees "disconnected" has to
 * guess whether to wait, call someone, or go and fix it. The distinction between
 * `disabled` (press Start — the credentials are fine) and `session_expired` (scan
 * a new QR — the credentials are gone) is the whole reason the backend derives
 * these separately, so it must survive into the copy.
 */
const PRESENTATION: Record<InboxChannelState, Presentation | null> = {
  // Nothing to say. Rendering a green "all good" bar permanently above an inbox
  // trains people to ignore the bar.
  connected: null,
  // Both resolve on their own in seconds; a call to action would be wrong.
  connecting: null,
  unknown: null,

  removed: {
    severity: 'error',
    title: 'WhatsApp connection removed',
    body:
      'The WhatsApp messenger for this inbox has been deleted. Past conversations ' +
      'are still readable, but no new messages can be received or sent until a ' +
      'number is connected again.',
    action: 'Connect a messenger',
  },
  session_expired: {
    severity: 'error',
    title: 'WhatsApp session expired',
    body:
      'WhatsApp has unlinked this device, so the saved login is no longer valid. ' +
      'Sign in again by scanning the QR code to restore messaging.',
    action: 'Log in again',
  },
  failed: {
    severity: 'error',
    title: 'WhatsApp connection failed',
    body:
      'The connection stopped after repeated failures and will not retry on its ' +
      'own. Restart it from the Social Messengers page to bring messaging back.',
    action: 'Fix the connection',
  },
  disabled: {
    severity: 'warning',
    title: 'WhatsApp connection disabled',
    body:
      'This WhatsApp messenger is currently stopped, so incoming messages are not ' +
      'being received and replies cannot be sent. Start it again to resume.',
    action: 'Enable the connection',
  },
  awaiting_scan: {
    severity: 'warning',
    title: 'WhatsApp is waiting to be linked',
    body:
      'A QR code is ready but has not been scanned yet. Finish scanning it with ' +
      'the WhatsApp app to complete the connection.',
    action: 'Scan the QR code',
  },
  not_connected: {
    severity: 'warning',
    title: 'WhatsApp is not connected yet',
    body:
      'This messenger has been created but no WhatsApp number is linked to it ' +
      'yet, so it cannot send or receive messages.',
    action: 'Finish setup',
  },
  reconnecting: {
    severity: 'info',
    title: 'Reconnecting to WhatsApp',
    body:
      'The connection dropped and is being restored automatically. Replies sent ' +
      'right now may not be delivered — this usually clears within a minute.',
  },
};

/**
 * Connection health banner for one channel tab.
 *
 * WHY THIS IS NEEDED AT ALL
 * -------------------------
 * The channel tabs are derived from stored threads, which are permanent on
 * purpose — they outlive the messenger that created them. So a WhatsApp connection
 * that has been deleted, stopped, or logged out by WhatsApp leaves behind a tab
 * full of conversations that look completely normal. Without this banner the first
 * anyone hears about it is a reply that fails after an agent has already typed it.
 */
const ChannelStatusBanner = ({ channel }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const status = useSelector(
    (state: RootState) => state.inbox.channelStatus[channel],
  );

  const state = status?.state;
  const healthy = !state || state === 'connected';

  useEffect(() => {
    if (!channel) return;
    dispatch(getInboxChannelStatus(channel));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  useEffect(() => {
    // Only poll while something is wrong — see UNHEALTHY_POLL_MS.
    if (!channel || healthy) return;
    const timer = setInterval(
      () => dispatch(getInboxChannelStatus(channel)),
      UNHEALTHY_POLL_MS,
    );

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, healthy]);

  if (!state) return null;
  const presentation = PRESENTATION[state];
  if (!presentation) return null;

  const label = channelLabel(channel);
  // A per-account reason the engine recorded (why a `failed` session failed) is
  // worth showing verbatim: it is usually the only clue to the actual cause.
  const detail = status?.accounts?.find((a) => a.detail)?.detail;

  return (
    <Alert
      severity={presentation.severity}
      sx={{ mb: 4 }}
      action={
        presentation.action ? (
          <Button
            size="small"
            color="inherit"
            variant="outlined"
            sx={{ whiteSpace: 'nowrap' }}
            onClick={() => router.push(SOCIAL_MESSENGERS_ROUTE)}
          >
            {presentation.action}
          </Button>
        ) : undefined
      }
    >
      {/* The channel name is in the title because an agent may have several tabs
          open and a bare "connection removed" does not say which one. */}
      <AlertTitle sx={{ mb: 0.5 }}>
        {label}: {presentation.title}
      </AlertTitle>
      <Box>
        <Typography variant="body2" sx={{ color: 'inherit' }}>
          {presentation.body}
        </Typography>
        {detail ? (
          <Typography
            variant="caption"
            sx={{ display: 'block', mt: 0.5, opacity: 0.8, color: 'inherit' }}
          >
            Reported error: {detail}
          </Typography>
        ) : null}
      </Box>
    </Alert>
  );
};

export default ChannelStatusBanner;
