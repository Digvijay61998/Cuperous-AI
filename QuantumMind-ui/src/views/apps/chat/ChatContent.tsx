// ** React Imports
import { Fragment, useEffect } from 'react';

// ** MUI Imports
import { Stack } from '@mui/material';
import MuiAvatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box, { BoxProps } from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Rating from '@mui/material/Rating';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
// ** Icon Imports
import Tooltip from '@mui/material/Tooltip';
import Icon from 'src/@core/components/icon';

// ** Custom Components Import
import CustomAvatar from 'src/@core/components/mui/avatar';
import UserProfileRight from 'src/views/apps/chat/UserProfileRight';
import ChatLog from './ChatLog';
import Feedback from './Feedback';
import CreateTicketRight from './ViewTicket';

// ** Types
import { ChatContentType } from 'src/types/apps/chatTypes';

// ** Actions Imports
import { fetchVisitorDetail } from 'src/store/apps/visitor';

// ** Store & Actions Imports
import { useDispatch, useSelector } from 'react-redux';

// ** Types
import { AppDispatch } from 'src/store';
import returnPlatformIcon from 'src/components/PlatforomIcons';
import Divider from '@mui/material/Divider';
// ** Styled Components
const ChatWrapperStartChat = styled(Box)<BoxProps>(({ theme }) => ({
  flexGrow: 1,
  height: '100%',
  display: 'flex',
  borderRadius: 1,
  alignItems: 'center',
  flexDirection: 'column',
  justifyContent: 'center',
  backgroundColor: theme.palette.action.hover,
}));



const ChatContent = (props: ChatContentType) => {
  // ** Props
  const {
    store,
    hidden,
    sendMsg,
    mdAbove,
    dispatch,
    statusObj,
    getInitials,
    sidebarWidth,
    userProfileRightOpen,
    createTicketRightOpen,
    questionBankRightOpen,
    handleLeftSidebarToggle,
    handleUserProfileRightSidebarToggle,
    handleCreateTicketRightSidebarToggle,
    handleQuestionBankRightSidebarToggle,
  } = props;

  const handleStartConversation = () => {
    if (!mdAbove) {
      handleLeftSidebarToggle();
    }
  };


  const renderContent = () => {
    if (store) {
      const selectedChat = store.selectedConversation;

      const dispatch = useDispatch<AppDispatch>();


      useEffect(() => {
        if (store?.selectedConversation?.visitor?._id) {
          dispatch(
            fetchVisitorDetail(store?.selectedConversation?.visitor?._id),
          );
        }

        return () => {};
      }, [dispatch, store?.selectedConversation?.visitor?._id]);

      if (!selectedChat) {
        return (
          <ChatWrapperStartChat
            sx={{background:'#fff',
            boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px',
            marginLeft:'1rem',
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
              onClick={handleStartConversation}
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
              backgroundColor:'#fff',
              boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px', marginLeft:'1rem'
            }}
          >
            <Box
              sx={{
                py: 3,
                px: 5,
                display: 'flex',
                alignItems: 'center',
                background:'#fff',
                justifyContent: 'space-between',
                borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {mdAbove ? null : (
                  <IconButton onClick={handleLeftSidebarToggle} sx={{ mr: 2 }}>
                    <Icon icon="bx:menu" />
                  </IconButton>
                )}
                <Box
                  onClick={handleUserProfileRightSidebarToggle}
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
       
                    
                  >
                    <CustomAvatar
                      skin="light"
                      color="primary"
                      sx={{
                        width: '2.375rem',
                        height: '2.375rem',
                        fontSize: '1rem',
                      }}
                    >
                      {getInitials(selectedChat.visitor?.name)}
                    </CustomAvatar>
                  </Badge>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Stack
                      direction="row"
                      justifyContent="flex-start"
                      alignItems="center"
                    >
                      <Typography
                        sx={{ fontWeight: 500, fontSize: '0.875rem', mr: 3 }}
                      >
                        {selectedChat.visitor?.name}
                      </Typography>
                      <Tooltip 
                        title={selectedChat.visitor?.platform || selectedChat?.platform} 
                        placement='top' 
                        arrow
                      >
                        <IconButton
                          aria-label="Platform"
                          size="small"
                        >
                          {returnPlatformIcon(selectedChat.visitor?.platform || selectedChat?.platform)}
                        </IconButton>
                      </Tooltip>
                     
                    </Stack>
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.disabled' }}
                    >
                      {selectedChat.bot?.name}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {mdAbove ? (
                  <Fragment>
                    <Tooltip title="View Details" placement="top">
                      <IconButton
                        onClick={handleUserProfileRightSidebarToggle}
                        size="small"
                        sx={{ color: 'text.secondary' }}
                      >
                        <Icon icon="carbon:view-filled" fontSize="1.25rem" />
                      </IconButton>
                    </Tooltip>
                    {/* <Tooltip title="Forward To" placement="top">
                      <IconButton size="small" sx={{ color: 'text.secondary' }}>
                        <Icon
                          icon="akar-icons:arrow-forward-thick-fill"
                          fontSize="1.25rem"
                        />
                      </IconButton>
                    </Tooltip> */}
                    <Tooltip title="View Created Service Request" placement="top">
                      <IconButton 
                        onClick={handleCreateTicketRightSidebarToggle} 
                        size="small" 
                        sx={{ color: 'text.secondary' }}
                      >
                        <Icon icon="fontisto:ticket" fontSize="1.25rem" />
                      </IconButton>
                    </Tooltip>
                   
                  </Fragment>
                ) : null}
              </Box>
            </Box>

            {selectedChat ? (
              <ChatLog
                hidden={hidden}
                data={{ ...selectedChat, userContact: store.userProfile }}
              />
            ) : null}
            
            {selectedChat?.feedbacks?.length > 0 && (
            <>
            
              <Feedback
                rating={
                  selectedChat.feedbacks[selectedChat.feedbacks.length - 1]
                    .rating
                }
                message={
                  selectedChat.feedbacks[selectedChat.feedbacks.length - 1]
                    .comment
                }
              />
            </>
            )}
            <UserProfileRight
              store={selectedChat.visitor?._id}
              hidden={hidden}
              statusObj={statusObj}
              getInitials={getInitials}
              sidebarWidth={sidebarWidth}
              userProfileRightOpen={userProfileRightOpen}
              handleUserProfileRightSidebarToggle={
                handleUserProfileRightSidebarToggle
              }
            />
            <CreateTicketRight 
              store={selectedChat.visitor?._id}
              hidden={hidden}
              statusObj={statusObj}
              getInitials={getInitials}
              sidebarWidth={sidebarWidth}
              createTicketRightOpen={createTicketRightOpen}
              handleCreateTicketRightSidebarToggle={
                handleCreateTicketRightSidebarToggle
              }
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
