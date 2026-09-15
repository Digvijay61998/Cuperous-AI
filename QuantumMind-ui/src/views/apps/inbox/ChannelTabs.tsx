// ** React Imports
import { useEffect } from 'react';

// ** MUI Imports
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Tooltip from '@mui/material/Tooltip';

// ** Store & Actions
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import {
  getInboxChannels,
  LIVE_CHAT_TAB,
  setInboxTab,
} from 'src/store/apps/inbox';

// ** Utils
import Icon from 'src/@core/components/icon';
import returnPlatformIcon from 'src/components/PlatforomIcons';
import { channelLabel } from './channelConfig';

/**
 * The inbox channel tab strip.
 *
 * Data-driven: the tab list comes from `GET /inbox/channels`, so integrating a
 * new platform makes a tab appear with no change to this file. The only
 * hardcoded entry is "Live Chat", because that one is not a channel — it is the
 * existing widget/agent console, kept as the default so nothing changes for an
 * agent who never touches channels.
 *
 * Scrollable rather than fullWidth: the number of tabs grows with the number of
 * integrations, and `fullWidth` would shrink every label to nothing by the time
 * there are five.
 */
const ChannelTabs = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { channels, activeTab } = useSelector(
    (state: RootState) => state.inbox,
  );

  useEffect(() => {
    dispatch(getInboxChannels());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (_e: React.SyntheticEvent, value: string) => {
    dispatch(setInboxTab(value));
  };

  return (
    <Box
      sx={{
        mb: 4,
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        backgroundColor: 'background.paper',
        borderRadius: 1,
        boxShadow:
          'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px',
      }}
    >
      <Tabs
        value={activeTab}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        aria-label="Conversation channels"
      >
        <Tab
          value={LIVE_CHAT_TAB}
          label="Live Chat"
          icon={<Icon icon="bx:message-rounded-dots" fontSize={20} />}
          iconPosition="start"
          sx={{ minHeight: 56, textTransform: 'none' }}
        />

        {channels.map((entry) => {
          const label = channelLabel(entry.channel);
          return (
            <Tab
              key={entry.channel}
              value={entry.channel}
              sx={{ minHeight: 56, textTransform: 'none' }}
              iconPosition="start"
              icon={
                <Tooltip title={label} placement="top">
                  {/* Badge shows threads needing attention, not message count.
                      Suppressed while the tab is selected — the agent is looking
                      at it, so a count there is noise. */}
                  <Badge
                    color="error"
                    badgeContent={entry.unread}
                    invisible={
                      !entry.unread || activeTab === entry.channel
                    }
                    sx={{ '& .MuiBadge-badge': { top: -2, right: -4 } }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {returnPlatformIcon(entry.channel)}
                    </Box>
                  </Badge>
                </Tooltip>
              }
              label={label}
            />
          );
        })}
      </Tabs>
    </Box>
  );
};

export default ChannelTabs;
