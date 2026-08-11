// ** React Imports
import { Fragment, useEffect, useRef, useState } from 'react';

// ** MUI Imports
import Badge from '@mui/material/Badge';
import MuiAvatar from '@mui/material/Avatar';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Box, { BoxProps } from '@mui/material/Box';

// ** Icon Imports
import Icon from 'src/@core/components/icon';
import Tooltip from '@mui/material/Tooltip';

// ** Custom Components Import
import ChatLog from './ChatLog';
import SendMsgForm from 'src/views/bots/test-bot/chat/SendMsgForm';
import CustomAvatar from 'src/@core/components/mui/avatar';
import OptionsMenu from 'src/@core/components/option-menu';
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
    sendMsg,
    mdAbove,
    dispatch,
    statusObj,
    getInitials,
    setIsBotOpen,
    socket,
    messagesArray,
    setMessagesArray,
    myMessages,
    updatemyMessages,
    visitorAccessToken,
  } = props;

  const ele = document?.getElementsByClassName('react-flow')[0]?.clientHeight;
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
              height: ele - 10,
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
                  <Badge
                    overlap="circular"
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    sx={{ mr: 3 }}
                    badgeContent={
                      <Box
                        component="span"
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          color: `${
                            statusObj[selectedChat.contact.status]
                          }.main`,
                          boxShadow: (theme) =>
                            `0 0 0 2px ${theme.palette.background.paper}`,
                          backgroundColor: `${
                            statusObj[selectedChat.contact.status]
                          }.main`,
                        }}
                      />
                    }
                  >
                    {selectedChat.contact.avatar ? (
                      <MuiAvatar
                        src={'/logo.jpeg'}
                        alt={'JarCube'}
                        sx={{ width: '2.375rem', height: '2.375rem' }}
                      />
                    ) : (
                      <CustomAvatar
                        skin="light"
                        color={selectedChat.contact.avatarColor}
                        sx={{
                          width: '2.375rem',
                          height: '2.375rem',
                          fontSize: '1rem',
                        }}
                      >
                        {getInitials('JarCube')}
                      </CustomAvatar>
                    )}
                  </Badge>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                      JarCube
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.disabled' }}
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
                        sx={{ color: 'text.secondary' }}
                      >
                        <Icon
                          icon="mdi:minimize"
                          fontSize={28}
                          fontWeight="bold"
                        />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="More" placement="top">
                      <IconButton size="small" sx={{ color: 'text.secondary' }}>
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
                messageArray={messagesArray}
                setMessageArray={setMessagesArray}
                socket={socket}
                hidden={hidden}
                myMessages={myMessages}
                data={{
                  messages: messagesArray,
                  userContact: store.userProfile,
                }}
                updatemyMessages={updatemyMessages}
              />
            ) : null}

            <SendMsgForm
              store={store}
              dispatch={dispatch}
              sendMsg={sendMsg}
              socket={socket}
              setMessagesArray={setMessagesArray}
              messageArray={messagesArray}
              myMessages={myMessages}
              updatemyMessages={updatemyMessages}
              visitorAccessToken={visitorAccessToken}
            />
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
