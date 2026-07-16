// ** React Imports
import { ChangeEvent, ReactNode, useEffect, useState } from 'react';

// ** Next Imports
import { useRouter } from 'next/router';

// ** MUI Imports
import MuiAvatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { Theme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

// ** Third Party Components
import PerfectScrollbar from 'react-perfect-scrollbar';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Types
import {
  ChatsArrType,
  ChatSidebarLeftType,
  ContactType,
} from 'src/types/apps/chatTypes';

// ** Custom Components Import
import CustomAvatar from 'src/@core/components/mui/avatar';

// ** Chat App Components Imports
import UserProfileLeft from 'src/views/apps/chat/UserProfileLeft';
import { visitedChat } from 'src/store/apps/conversation';

// ** Actions Imports

// ** Store & Actions Imports

// ** Types

const ScrollWrapper = ({
  children,
  hidden,
}: {
  children: ReactNode;
  hidden: boolean;
}) => {
  if (hidden) {
    return <Box sx={{ height: '100%', overflow: 'auto' }}>{children}</Box>;
  } else {
    return (
      <PerfectScrollbar options={{ wheelPropagation: false }}>
        {children}
      </PerfectScrollbar>
    );
  }
};

const SidebarLeft = (props: ChatSidebarLeftType) => {
  // ** Props
  const {
    store,
    hidden,
    mdAbove,
    dispatch,
    statusObj,
    userStatus,
    enableSound,
    selectChat,
    getInitials,
    sidebarWidth,
    setUserStatus,
    leftSidebarOpen,
    removeSelectedChat,
    userProfileLeftOpen,
    formatDateToMonthShort,
    handleLeftSidebarToggle,
    handleUserProfileLeftSidebarToggle,
    clearActiveMessage,
    addActiveMessage,
    handleSoundToggle,
    updateActiveConversation,
  } = props;

  // ** States
  const [query, setQuery] = useState<string>('');
  const [filteredChat, setFilteredChat] = useState<ChatsArrType[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<ContactType[]>([]);
  const [active, setActive] = useState<null | {
    type: string;
    id: string | number;
  }>(null);

  // ** Hooks
  const router = useRouter();

  const handleChatClick = (
    type: 'chat' | 'contact',
    id: string,
    visitorId: string,
  ) => {
    dispatch(visitedChat({id, visitorId}))
    dispatch(addActiveMessage({id, visitorId}));

    setActive({ type, id });
    if (!mdAbove) {
      handleLeftSidebarToggle();
    }
  };


  useEffect(() => {
    router.events.on('routeChangeComplete', () => {
      setActive(null);
      dispatch(removeSelectedChat());
    });

    return () => {
      setActive(null);
      dispatch(removeSelectedChat());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderChats = () => {
    if (store.activeConversations && store.activeConversations.length) {
      if (query.length &&  !filteredContacts?.length) {
        return (
          <ListItem>
            <Typography sx={{ color: 'text.secondary' }}>
              No Chats Found
            </Typography>
          </ListItem>
        );
      } else {
        const arrToMap =
          query.length && filteredContacts.length
            ? filteredContacts
            : store.activeConversations;

        return arrToMap.map((chat: any, index: number) => {
          const { lastMessage } = chat;
          const activeCondition =
            active !== null && active.id === chat._id && active.type === 'chat';

          return (
            <ListItem
              key={index}
              disablePadding
              sx={{ '&:not(:last-child)': { mb: 1.5 } }}
            >
              <ListItemButton
                disableRipple
                onClick={() => handleChatClick('chat', chat._id, chat.visitor._id)}
                sx={{
                  px: 3,
                  py: 2.5,
                  width: '100%',
                  borderRadius: 1,
                  alignItems: 'flex-start',
                  backgroundColor: (theme: Theme) =>
                    activeCondition
                      ? `${theme.palette.primary.main} !important`
                      : '',
                }}
              >
                <ListItemAvatar sx={{ m: 0 }}>
                  <Badge
                    overlap="circular"
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    badgeContent={
                      <Box
                        component="span"
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          color: `${statusObj['online']}`,
                          backgroundColor: `${statusObj['online']}.main`,
                          boxShadow: (theme: Theme) =>
                            `0 0 0 2px ${
                              !activeCondition
                                ? theme.palette.background.paper
                                : theme.palette.common.white
                            }`,
                        }}
                      />
                    }
                  >
                    {chat.avatar ? (
                      <MuiAvatar
                        src={chat.avatar}
                        alt={chat.fullName}
                        sx={{
                          width: 38,
                          height: 38,
                          border: (theme: Theme) =>
                            activeCondition
                              ? `2px solid ${theme.palette.common.white}`
                              : '',
                        }}
                      />
                    ) : (
                      <CustomAvatar
                        color={chat.avatarColor}
                        skin={activeCondition ? 'light-static' : 'light'}
                        sx={{
                          width: 38,
                          height: 38,
                          fontSize: '1rem',
                          border: (theme: Theme) =>
                            activeCondition
                              ? `2px solid ${theme.palette.common.white}`
                              : '',
                        }}
                      >
                        {getInitials(chat.visitor?.name)}
                      </CustomAvatar>
                    )}
                  </Badge>
                </ListItemAvatar>
                <ListItemText
                  sx={{
                    my: 0,
                    ml: 4,
                    mr: 1.5,
                    '& .MuiTypography-root': {
                      ...(activeCondition ? { color: 'common.white' } : {}),
                    },
                  }}
                  primary={
                    <Typography
                      noWrap
                      sx={{ fontWeight: 500, fontSize: '0.875rem' }}
                    >
                      {chat.visitor?.name}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      noWrap
                      variant="body2"
                      sx={{
                        color: !activeCondition
                          ? (theme: Theme) => theme.palette.text.disabled
                          : {},
                      }}
                    >
                      {lastMessage ? lastMessage.message : null}
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
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'nowrap',
                      color: activeCondition ? 'common.white' : 'text.disabled',
                    }}
                  >
                    <>
                      {lastMessage && lastMessage?.time
                        ? formatDateToMonthShort(
                            lastMessage?.time || String(new Date().getTime()) as string,
                            true,
                          )
                        : new Date().toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            })}
                    </>
                    
                  </Typography>
                  {chat?.unseenMsgs && chat.unseenMsgs > 0 ? (
                    <Chip
                      color="success"
                      label={chat.unseenMsgs}
                      sx={{
                        mt: 0.5,
                        
                        height: 18,
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        '& .MuiChip-label': { pt: 0.25, px: 1.655 },
                      }}
                    />
                  ) : null}
                </Box>
              </ListItemButton>
            </ListItem>
          );
        });
      }
    }
  };
  const handleFilter = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (
      store.activeConversations.length !== null
    ) {
      const filterVisitorsArr =store.activeConversations?.filter((item: any) =>
      item?.visitor?.name?.toLowerCase()?.includes(e.target.value?.toLowerCase()));
      setFilteredContacts(filterVisitorsArr);
    }
  };

  return (
    <div style={{boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px', marginRight:'1rem'}} >
      <Drawer
        open={leftSidebarOpen}
        onClose={handleLeftSidebarToggle}
        variant={mdAbove ? 'permanent' : 'temporary'}
        ModalProps={{
          disablePortal: true,
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          zIndex: 7,
          height: '100%',
          display: 'flex', alignItems: 'center' ,background:'#F0F5FE', padding:'0 0 5rem ',
          position: mdAbove ? 'static' : 'absolute',
          '& .MuiDrawer-paper': {
            boxShadow: 'none',
            width: sidebarWidth,
            position: mdAbove ? 'static' : 'absolute',

            borderTopLeftRadius: (theme: Theme) => theme.shape.borderRadius,
            borderBottomLeftRadius: (theme: Theme) => theme.shape.borderRadius,
          },
          '& > .MuiBackdrop-root': {
            position: 'absolute',
            zIndex: (theme: Theme) => theme.zIndex.drawer - 1,
          },
        }}
      >
        <Box
          sx={{
            px: 5,
            py: 3.125,
            
            display: 'flex',
            alignItems: 'center',
            borderBottom: (theme: Theme) =>
              `1px solid ${theme.palette.divider}`,
          }}
        >
          {store && store.userProfile ? (
            <Badge
              overlap="circular"
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              sx={{ mr: 4 }}
              onClick={handleUserProfileLeftSidebarToggle}
              badgeContent={
                <Box
                  component="span"
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    color: `${statusObj[userStatus]}.main`,
                    backgroundColor: `${statusObj[userStatus]}.main`,
                    boxShadow: (theme: Theme) =>
                      `0 0 0 2px ${theme.palette.background.paper}`,
                  }}
                />
              }
            >
              <MuiAvatar
                src={store.userProfile.avatar}
                alt={store.userProfile.fullName}
                sx={{
                  width: '2.375rem',
                  height: '2.375rem',
                  cursor: 'pointer',
                }}
              />
            </Badge>
          ) : null}
          <TextField
            fullWidth
            size="small"
            value={query}
            onChange={handleFilter}
            placeholder="Search for contact..."
            sx={{ '& .MuiInputBase-root': { borderRadius: 5 } }}
            InputProps={{
              startAdornment: (
                <InputAdornment
                  position="start"
                  sx={{ color: 'text.secondary' }}
                >
                  <Icon icon="bx:search" fontSize={20} />
                </InputAdornment>
              ),
            }}
          />
          {!mdAbove ? (
            <IconButton sx={{ p: 1, ml: 1 }} onClick={handleLeftSidebarToggle}>
              <Icon icon="bx:x" />
            </IconButton>
          ) : null}
        </Box>

        <Box sx={{ height: `calc(100% - 4.125rem)`,      borderRadius: 1, }}>
          <ScrollWrapper hidden={hidden}>
            <Box sx={{ p: (theme: Theme) => theme.spacing(7, 3, 3) }}>
              <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                <Typography
                  variant="h6"
                  sx={{ ml: 3, mb: 3, color: 'primary.main' }}
                >
                  Active Conversations
                </Typography>
                <Tooltip title={enableSound?"Mute":"Unmute"} placement="top">
                  <IconButton
                    onClick={handleSoundToggle}
                    size="small"
                    sx={{ color: 'text.secondary' }}
                  >
                    <Icon icon={enableSound?"akar-icons:sound-on":"akar-icons:sound-off"} fontSize="1.25rem" />
                  </IconButton>
                </Tooltip>
              </Stack>
              <List sx={{ mb: 4, p: 0 }}>{renderChats()}</List>
            </Box>
          </ScrollWrapper>
        </Box>
      </Drawer>

      <UserProfileLeft
        store={store}
        hidden={hidden}
        statusObj={statusObj}
        userStatus={userStatus}
        sidebarWidth={sidebarWidth}
        setUserStatus={setUserStatus}
        userProfileLeftOpen={userProfileLeftOpen}
        handleUserProfileLeftSidebarToggle={handleUserProfileLeftSidebarToggle}
      />
    </div>
  );
};

export default SidebarLeft;
