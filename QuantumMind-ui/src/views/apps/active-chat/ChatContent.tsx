// ** React Imports
import { Fragment, useEffect, useState } from 'react';

// ** MUI Imports
import { LoadingButton } from '@mui/lab';
import { Button, Stack } from '@mui/material';
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
import SendMsgForm from 'src/views/apps/active-chat/SendMsgForm';
import UserProfileRight from 'src/views/apps/active-chat/UserProfileRight';
import ChatLog from './ChatLog';
import CreateTicketRight from './CreateTicket';
import QuestionBank from './QuestionBankOption';

// ** Types

// ** Actions Imports

// ** Store & Actions Imports
import { useDispatch, useSelector } from 'react-redux';
import returnPlatformIcon from 'src/components/PlatforomIcons';
// ** Types
import { toast } from 'react-hot-toast';
import CommonDialog from 'src/components/dialogs/general-dialog';
import { AppDispatch, RootState } from 'src/store';
import {
  getActiveSelectedChat,
  loadOldChats,
  removedChat,
  removedSelectedChat,
} from 'src/store/apps/conversation';
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
    sidebarWidth,
    userProfileRightOpen,
    createTicketRightOpen,
    questionBankRightOpen,
    handleLeftSidebarToggle,
    handleUserProfileRightSidebarToggle,
    handleCreateTicketRightSidebarToggle,
    handleQuestionBankRightSidebarToggle,
    socket,
    setUpdateStats,
  } = props;

  const handleStartConversation = () => {
    if (!mdAbove) {
      handleLeftSidebarToggle();
    }
  };

  // const [role, setRole] = useState<string>('');
  // const [plan, setPlan] = useState<string>('');
  // const [value, setValue] = useState<string>('');
  // const [status, setStatus] = useState<string>('');
  // const [pageSize, setPageSize] = useState<number>(10);
  // const [addUserOpen, setAddUserOpen] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);
  const [openBlockDialog, setOpenBlockDialog] = useState<boolean>(false);
  const handleCloseBlockDialog = () => setOpenBlockDialog(false);
  const {
    activeChatId,
    activeConversations,
    selectedVisitorId,
    activeSelectedChat,
  } = useSelector((state: RootState) => state.conversations);
  const handleLoadOldChats = () => {
    dispatch(loadOldChats(activeChatId));
  };

  const blockVisitor = () => {
    setLoading(true);
    socket.reportChat({
      data: {
        conversationId: activeChatId,
        visitorId: selectedVisitorId,
      },
    });
    setUpdateStats((pre: boolean) => !pre);
    dispatch(removedChat({ id: activeChatId }));
    dispatch(removedSelectedChat(0));
    setOpenBlockDialog(false);
    setLoading(false);
    toast.success('Chat has been reported');
  };
  const ActionComponent = () => {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: -2,
          width: '100%',
        }}
      >
        <Button
          variant="outlined"
          size="small"
          onClick={handleCloseBlockDialog}
          color="primary"
          sx={{ mr: 2 }}
        >
          Cancel
        </Button>
        <LoadingButton
          loading={loading}
          variant="contained"
          size="small"
          onClick={blockVisitor}
          color="error"
        >
          Confirm
        </LoadingButton>
      </Box>
    );
  };

  const [closeChatDialog, setCloseChatDialog] = useState<boolean>(false);
  const handleCloseChatDialog = () => setCloseChatDialog(false);
  const closeChat = () => {
    setLoading(true);
    socket.endChat({
      data: {
        conversationId: activeChatId,
        visitorId: selectedVisitorId,
      },
    });
    setUpdateStats((pre: boolean) => !pre);
    dispatch(removedSelectedChat(0));
    dispatch(removedChat({ id: activeChatId }));

    setLoading(false);
    setCloseChatDialog(false);
    toast.success('conversation has been closed');
  };
  const CloseChatActionComponent = () => {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: -2,
          width: '100%',
        }}
      >
        <Button
          variant="outlined"
          size="small"
          onClick={handleCloseChatDialog}
          color="primary"
          sx={{ mr: 2 }}
        >
          Cancel
        </Button>
        <LoadingButton
          loading={loading}
          variant="contained"
          size="small"
          onClick={closeChat}
          color="primary"
        >
          Confirm
        </LoadingButton>
      </Box>
    );
  };
  const renderContent = () => {
    if (store) {
      const [selectedChat, setSelectedChat] = useState<any>(null);

      const dispatch = useDispatch<AppDispatch>();
      useEffect(() => {
        if (activeChatId) {
          dispatch(getActiveSelectedChat(activeChatId));
        }
      }, [activeChatId]);
      useEffect(() => {
        if (activeSelectedChat?.chats) {
          setSelectedChat(activeSelectedChat);
        } else {
          setSelectedChat(null);
        }
      }, [activeSelectedChat]);
      if (!selectedChat) {
        return (
          <div style={{ width:'100%',
           padding:'0 0 5rem ',
          background:'#F0F5FE'}}>
          <ChatWrapperStartChat
            sx={{ 
             background:'#fff',
              ...(mdAbove
                ? { borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }
                : {}),
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                width: '100%',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'}}
                >
                  <Icon
                    icon="fluent:chat-28-filled"
                    fontSize="3.5rem"
                    style={{ color: 'text.disabled' }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.disabled', fontSize: '1.1rem' }}
                  >
                    No conversation selected
                  </Typography>
                </Box>
              </Box>
            </Box>
          </ChatWrapperStartChat></div>
        );
      } else {
        return (
          <Box
            sx={{
              flexGrow: 1,
              width: '100%',
              height: '100%',
              backgroundColor: (theme) => theme.palette.action.hover,
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
                    badgeContent={
                      <Box
                        component="span"
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          color: `${statusObj['online']}.main`,
                          boxShadow: (theme) =>
                            `0 0 0 2px ${theme.palette.background.paper}`,
                          backgroundColor: `${statusObj['online']}.main`,
                        }}
                      />
                    }
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
                      {selectedChat.visitor?.name &&
                        getInitials(selectedChat.visitor?.name)}
                    </CustomAvatar>
                  </Badge>
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Stack
                      direction="row"
                      justifyContent="flex-start"
                      alignItems="center"
                    >
                      <Typography
                        sx={{ fontWeight: 500, fontSize: '0.875rem' }}
                      >
                        {selectedChat.visitor?.name}
                      </Typography>
                      <Tooltip
                        title={
                          selectedChat.visitor?.platform ||
                          selectedChat?.platform || 'unknown'
                        }
                        placement="top"
                        arrow
                      >
                        <IconButton aria-label="Platform" size="small">
                          {returnPlatformIcon(
                            selectedChat.visitor?.platform ||
                              selectedChat?.platform,
                          )}
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

                    <Tooltip title="Create Ticket" placement="top">
                      <IconButton
                        onClick={handleCreateTicketRightSidebarToggle}
                        size="small"
                        sx={{ color: 'text.secondary' }}
                      >
                        <Icon icon="fontisto:ticket" fontSize="1.25rem" />
                      </IconButton>
                    </Tooltip>
                    {/* <Tooltip title="Report Visitor" placement="top">
                      <IconButton size="small" sx={{ color: 'text.secondary' }}>
                        <Icon icon="ic:baseline-report" fontSize="1.25rem" />
                      </IconButton>
                    </Tooltip> */}
                    <Tooltip title="Question Bank" placement="top">
                      <IconButton
                        onClick={handleQuestionBankRightSidebarToggle}
                        size="small"
                        sx={{ color: 'text.secondary' }}
                      >
                        <Icon
                          icon="fluent:book-question-mark-24-filled"
                          fontSize="1.25rem"
                        />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Report visitor" placement="top">
                      <IconButton
                        onClick={(e: any) => setOpenBlockDialog((pre) => !pre)}
                        size="small"
                        sx={{ color: 'text.secondary' }}
                      >
                        <Icon
                          icon="material-symbols:block"
                          fontSize="1.25rem"
                        />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Close Conversation" placement="top">
                      <IconButton
                        onClick={(e: any) => setCloseChatDialog((pre) => !pre)}
                        size="small"
                        sx={{ color: 'text.secondary' }}
                      >
                        <Icon
                          icon="fluent:call-end-28-filled"
                          fontSize="1.25rem"
                        />
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
                store={store}
                handleLoadOldChats={handleLoadOldChats}
              />
            ) : null}

            <SendMsgForm
              store={store}
              dispatch={dispatch}
              sendMsg={sendMsg}
              socket={socket}
              visitorId={selectedChat.visitor?._id}
              activeChatId={activeChatId}
            />

            {userProfileRightOpen && (
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
            )}

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

            <QuestionBank
              store={selectedChat.visitor?._id}
              hidden={hidden}
              statusObj={statusObj}
              getInitials={getInitials}
              sidebarWidth={sidebarWidth}
              questionBankRightOpen={questionBankRightOpen}
              handleQuestionBankRightSidebarToggle={
                handleQuestionBankRightSidebarToggle
              }
              socket={socket}
            />
            <CommonDialog
              title={'Block Visitor Confirmation'}
              description={'Are you sure you want to block this visitor?'}
              open={openBlockDialog}
              onClose={handleCloseBlockDialog}
              Component={''}
              ActionComponent={ActionComponent}
            />

            <CommonDialog
              title={'Close Conversation Confirmation'}
              description={'Are you sure you want to close this conversation?'}
              open={closeChatDialog}
              onClose={handleCloseChatDialog}
              Component={''}
              ActionComponent={CloseChatActionComponent}
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
