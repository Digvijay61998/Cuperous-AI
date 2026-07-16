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

// ** Actions Imports
import { getconversations } from 'src/store/apps/conversation';

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

const SidebarLeft = (props: any) => {
  // ** Props
  const {
    store,
    hidden,
    mdAbove,
    dispatch,
    statusObj,
    userStatus,
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
    title
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

  const handleChatClick = (type: 'chat' | 'contact', id: number) => {
    dispatch(selectChat(id));
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
    if (store.list && store.list.length) {
      if (query.length && !filteredContacts.length) {
        return (
          <ListItem>
            <Typography sx={{ color: 'text.secondary' }}>
              No Chats Found
            </Typography>
          </ListItem>
        );
      } else {
        const arrToMap =
          query.length && filteredContacts.length ? filteredContacts : store.list;

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
                onClick={() => handleChatClick('chat', chat._id)}
                sx={{
                  px: 3,
                  py: 2.5,
                  background:'#F0F5FE',
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
                    {/* <>
                      {lastMessage && lastMessage.time
                        ? formatDateToMonthShort(
                            lastMessage.time as string,
                            true,
                          )
                        : new Date()}
                    </> */}
                  </Typography>
                  {chat?.chat?.unseenMsgs && chat.chat.unseenMsgs > 0 ? (
                    <Chip
                      color="error"
                      label={chat.chat.unseenMsgs}
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
    store.list !== null
  ) {
    const filterVisitorsArr =store.list?.filter((item: any) =>
    item?.visitor?.name?.toLowerCase()?.includes(e.target.value?.toLowerCase()));
    setFilteredContacts(filterVisitorsArr);
  }
};

  return (
    <div style={{boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'}} >
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
          height: '100%',overflow:'visible',
          display: 'flex', alignItems: 'center',
          position: mdAbove ? 'static' : 'absolute',
          '& .MuiDrawer-paper': {
            width: sidebarWidth,
            position: mdAbove ? 'static' : 'absolute',
            borderTopLeftRadius: (theme: Theme) => theme.shape.borderRadius,
            borderBottomLeftRadius: (theme: Theme) => theme.shape.borderRadius,
          },
          '& > .MuiBackdrop-root': {
            borderRadius: 1,
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

        <Box sx={{ height: `calc(100% - 4.125rem)` }}>
          <ScrollWrapper hidden={hidden}>
            <Box sx={{ p: (theme: Theme) => theme.spacing(7, 3, 3) }}>
              <Typography
                variant="h6"
                sx={{ ml: 3, mb: 3, color: 'primary.main' }}
              >
                {title || 'History'}
              </Typography>
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
