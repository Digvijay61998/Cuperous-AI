// ** MUI Imports
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// ** Components
import ChannelStatusBanner from './ChannelStatusBanner';
import ThreadContent from './ThreadContent';
import ThreadList from './ThreadList';

interface Props {
  channel: string;
}

/**
 * One channel tab's panel: thread list + message pane.
 *
 * The whole platform-specific surface is the `channel` string. There is no
 * WhatsApp component, no Telegram component — differences are declared in
 * channelConfig.ts and read by the shared children. That is what keeps N
 * platforms from becoming N forked screens.
 */
const ChannelInbox = ({ channel }: Props) => {
  const theme = useTheme();
  const smAbove = useMediaQuery(theme.breakpoints.up('sm'));
  const sidebarWidth = smAbove ? 370 : 300;

  return (
    <Box sx={{ width: '100%' }}>
      {/* Above the panel, not inside the thread pane: the connection is broken for
          the whole channel, not for the thread that happens to be selected, and an
          agent must see it before they pick a conversation and start typing. */}
      <ChannelStatusBanner channel={channel} />

      <Box sx={{ display: 'flex', width: '100%' }}>
        <ThreadList channel={channel} sidebarWidth={sidebarWidth} />
        <ThreadContent channel={channel} />
      </Box>
    </Box>
  );
};

export default ChannelInbox;
