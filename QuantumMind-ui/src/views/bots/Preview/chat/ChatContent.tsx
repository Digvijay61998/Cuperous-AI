// ** React Imports
import { Fragment } from 'react';

// ** MUI Imports
import MuiAvatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box, { BoxProps } from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

// ** Icon Imports
import Tooltip from '@mui/material/Tooltip';
import Icon from 'src/@core/components/icon';

// ** Custom Components Import
import CustomAvatar from 'src/@core/components/mui/avatar';
import SendMsgForm from 'src/views/bots/Preview/chat/SendMsgForm';
import ChatLog from './ChatLog';
// ** Types

// ** socket Imports

// ** Styled Components
const ChatWrapperStartChat = styled(Box)<BoxProps>(({ theme }) => ({
  height: '10vh',
  display: 'flex',
  borderRadius: 1,
  alignItems: 'center',
  flexDirection: 'column',
  justifyContent: 'center',
  backgroundColor: '#fff',
}));

const ChatContent = (props: any) => {
  // ** Props
  const {
    store,
    hidden,
    setIsBotOpen,
    mdAbove,
    headerBgColor,
    headerTextColor,
    avatar,
    primaryColor,
    textColor,
    buttonColor,
    buttonTextColor,
    botName
  } = props;

  const ele = document?.getElementById('bot-details')?.clientHeight;
  const renderContent = () => {
    if (store) {
      const selectedChat = store.selectedChat;
      if (!selectedChat) {
        return (
          <ChatWrapperStartChat
            sx={{
              ...(mdAbove
                ? { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }
                : {}),
            }}
          >
            <MuiAvatar
              sx={{
                mb: 6,
                pt: 8,
                pb: 7,
                px: 7.5,
                width: 110,
                height: 110,
                backgroundColor: 'background.paper',
                boxShadow: (theme) => theme.shadows[3],
              }}
            >
              <Icon icon="bx:message" fontSize="3.125rem" />
            </MuiAvatar>
            <Box
              sx={{
                py: 2,
                px: 6,
                borderRadius: 5,
                backgroundColor: 'background.paper',
                boxShadow: (theme) => theme.shadows[3],
                cursor: mdAbove ? 'default' : 'pointer',
              }}
            >
              <Typography
                sx={{
                  fontWeight: 500,
                  fontSize: '1.125rem',
                  lineHeight: 'normal',
                }}
              >
                Start Conversation
              </Typography>
            </Box>
          </ChatWrapperStartChat>
        );
      } else {
        return (
          <Box
            sx={{
              flexGrow: 1,
              width: '100%',
              height: '100%',
              backgroundColor: '#fff',
              borderRadius: '5px',
            }}
          >
            <Box
              sx={{
                py: 3,
                px: 5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                bgcolor: headerBgColor || "undefined",
               
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <MuiAvatar
                    src={avatar || '/logo.jpeg'}
                    alt={'JarCube'}
                    sx={{ width: '2.375rem', height: '2.375rem' }}
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', }}>
                    <Typography sx={{ fontWeight: 500, fontSize: '0.875rem',  color: headerTextColor || "undefined" }}>
                     {botName || "JarCube"}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{  color: headerTextColor || "undefined", opacity:0.7 }}
                    >
                      Handling by Agent
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {mdAbove ? (
                  <Fragment>
                    <Tooltip title="Close Chat" placement="top">
                      <IconButton
                        onClick={(e: any) => setIsBotOpen(false)}
                        size="small"
                        sx={{ color: headerTextColor || 'text.secondary', opacity: 8 }}
                      >
                        <Icon
                          icon="mdi:minimize"
                          fontSize={28}
                          fontWeight="bold"
                        />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="More" placement="top">
                      <IconButton size="small" sx={{ color: headerTextColor || 'text.secondary', opacity: 8 }}>
                        <Icon
                          icon="ic:outline-more-vert"
                          fontSize={25}
                          fontWeight="bold"
                        />
                      </IconButton>
                    </Tooltip>
                  </Fragment>
                ) : null}
              </Box>
            </Box>

            {selectedChat && store.userProfile ? (
              <ChatLog
                hidden={hidden}
                data={{
                  userContact: store.userProfile,
                }}
                {...props}
              />
            ) : null}
            {/* <SendMsgForm {...props} /> */}
          </Box>
        );
      }
    } else {
      return null;
    }
  };

  return renderContent();
};

export default ChatContent;
