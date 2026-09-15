// ** React Imports
import { ChangeEvent, useEffect, useMemo, useState } from 'react';

// ** MUI Imports
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// ** Store & Actions
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import {
  getInboxThreads,
  markInboxThreadRead,
  selectInboxThread,
} from 'src/store/apps/inbox';

// ** Utils
import Icon from 'src/@core/components/icon';
import CustomAvatar from 'src/@core/components/mui/avatar';
import { formatDateToMonthShort } from 'src/@core/utils/format';
import { getInitials } from 'src/@core/utils/get-initials';
import { InboxThread } from 'src/services/socket.services';

interface Props {
  channel: string;
  sidebarWidth: number;
}

/**
 * Generic channel thread list. One component for every platform — the channel is
 * a prop, never a branch.
 *
 * Deliberately NOT a Drawer, unlike the Live Chat sidebar: this list is always
 * visible inside its tab panel, so the Drawer's toggle/overlay machinery would be
 * dead weight. It reuses the same visual language (avatar + name + snippet + time
 * + unread chip) so the two tabs do not look like different products.
 */
const ThreadList = ({ channel, sidebarWidth }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    threadsByChannel,
    selectedThreadId,
    loadingThreads,
    threadCursorByChannel,
  } = useSelector((state: RootState) => state.inbox);

  const [query, setQuery] = useState<string>('');
  const threads = threadsByChannel[channel] || [];
  const nextCursor = threadCursorByChannel[channel] || null;

  useEffect(() => {
    if (channel) dispatch(getInboxThreads({ channel }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  /**
   * Search is client-side over the loaded page.
   *
   * The server supports `search` too, but debouncing a request per keystroke for
   * a list that is usually well under one page is worse on both latency and
   * request count. The server-side path is what the "load more" cursor is for
   * once a tenant genuinely has hundreds of threads.
   */
  const visible = useMemo(() => {
    if (!query.trim()) return threads;
    const q = query.toLowerCase();
    return threads.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) ||
        t.phone?.toLowerCase().includes(q),
    );
  }, [threads, query]);

  const handleSelect = (thread: InboxThread) => {
    // Selecting only sets the id. ThreadContent owns the message fetch, keyed on
    // "no cached list for this thread", so that first-open and post-reconnect
    // recovery share one rule — and clicking a thread twice does not refetch.
    dispatch(selectInboxThread(thread.id));

    // Only call read when there is something to clear — otherwise every click on
    // an already-read thread is a wasted round trip plus a needless receipt.
    if (thread.unreadCount > 0) {
      dispatch(markInboxThreadRead(thread.id));
    }
  };

  const handleLoadMore = () => {
    if (nextCursor) {
      dispatch(getInboxThreads({ channel, before: nextCursor }));
    }
  };

  const renderThreads = () => {
    if (loadingThreads && !threads.length) {
      return (
        <ListItem sx={{ justifyContent: 'center', py: 6 }}>
          <CircularProgress size={24} />
        </ListItem>
      );
    }

    if (!visible.length) {
      return (
        <ListItem>
          <Typography sx={{ color: 'text.secondary' }}>
            {query.trim() ? 'No contacts found' : 'No conversations yet'}
          </Typography>
        </ListItem>
      );
    }

    return visible.map((thread) => {
      const isActive = selectedThreadId === thread.id;
      const preview = thread.lastMessage?.message || '';

      return (
        <ListItem
          key={thread.id}
          disablePadding
          sx={{ '&:not(:last-child)': { mb: 1.5 } }}
        >
          <ListItemButton
            disableRipple
            onClick={() => handleSelect(thread)}
            sx={{
              px: 3,
              py: 2.5,
              width: '100%',
              borderRadius: 1,
              alignItems: 'flex-start',
              backgroundColor: isActive ? 'primary.main' : '#F0F5FE',
              '&:hover': {
                backgroundColor: isActive ? 'primary.main' : undefined,
              },
            }}
          >
            <CustomAvatar
              skin="light"
              color={isActive ? 'secondary' : 'primary'}
              src={thread.avatarUrl || undefined}
              sx={{ width: 38, height: 38, mr: 3, fontSize: '0.875rem' }}
            >
              {thread.name ? getInitials(thread.name) : null}
            </CustomAvatar>

            <ListItemText
              sx={{ my: 0, mr: 2 }}
              primary={
                <Typography
                  noWrap
                  sx={{
                    fontWeight: thread.unreadCount > 0 ? 600 : 500,
                    color: isActive ? 'common.white' : 'text.primary',
                  }}
                >
                  {thread.name}
                </Typography>
              }
              secondary={
                <Typography
                  noWrap
                  variant="body2"
                  sx={{
                    color: isActive ? 'common.white' : 'text.secondary',
                    ...(isActive && { opacity: 0.85 }),
                  }}
                >
                  {preview}
                </Typography>
              }
            />

            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-end',
                flexDirection: 'column',
                justifyContent: 'flex-start',
              }}
            >
              {/* Ternary, not `&&`: a thread with no activity carries a falsy
                  timestamp and React would render it as literal text. */}
              {thread.lastMessageAt ? (
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: 'nowrap',
                    color: isActive ? 'common.white' : 'text.disabled',
                  }}
                >
                  {formatDateToMonthShort(thread.lastMessageAt, true)}
                </Typography>
              ) : null}

              {thread.unreadCount > 0 ? (
                <Chip
                  color="error"
                  label={thread.unreadCount}
                  sx={{
                    mt: 0.5,
                    height: 18,
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    '& .MuiChip-label': { pt: 0.25, px: 1.655 },
                  }}
                />
              ) : null}

              {/* Ownership at a glance: an agent must be able to see which
                  threads the bot is still answering without opening each one. */}
              {thread.handledByAgent ? (
                <Icon
                  icon="material-symbols:support-agent"
                  fontSize={16}
                  style={{ marginTop: 4, opacity: 0.7 }}
                />
              ) : null}
            </Box>
          </ListItemButton>
        </ListItem>
      );
    });
  };

  return (
    <Box
      sx={{
        width: sidebarWidth,
        flexShrink: 0,
        height: '65vh',
        display: 'flex',
        flexDirection: 'column',
        mr: 4,
        backgroundColor: 'background.paper',
        borderRadius: 1,
        boxShadow:
          'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px',
      }}
    >
      <Box sx={{ p: 3, borderBottom: (t) => `1px solid ${t.palette.divider}` }}>
        <TextField
          fullWidth
          size="small"
          value={query}
          placeholder="Search for contact..."
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setQuery(e.target.value)
          }
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Icon icon="bx:search" fontSize={20} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
        <List sx={{ p: 0 }}>{renderThreads()}</List>

        {nextCursor ? (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography
              variant="body2"
              onClick={handleLoadMore}
              sx={{ cursor: 'pointer', color: 'primary.main' }}
            >
              Load older conversations
            </Typography>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
};

export default ThreadList;
