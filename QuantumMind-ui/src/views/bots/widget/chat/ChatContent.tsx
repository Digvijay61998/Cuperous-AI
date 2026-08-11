// ** React Imports

// ** MUI Imports
import MuiAvatar from '@mui/material/Avatar';
import Badge from '@mui/material/Badge';
import Box, { BoxProps } from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { getBotDetails } from 'src/store/apps/widget-preview/widget';
// ** Icon Imports
import { Icon } from '@iconify/react';
import Tooltip from '@mui/material/Tooltip';

// ** Custom Components Import
import { Button, Stack, TextField } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import ChatLog from './ChatLog';
import SendMsgForm from './SendMsgForm';
import { nanoid } from 'nanoid';
import MoreOptions from './components/more-options';
import { clearMessages } from 'src/store/apps/preview';
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
    mdAbove,
    statusObj,
    setIsBotOpen,
    socket,
    updatemyMessages,
    visitorAccessToken,
    botStyles,
    botSettings,
    botName,
    botId,
    loading,
    setLoading,
    isChatStart,
    setIsChatStart,
    handleStartPreview
  } = props;
  type dataType = {
    name: string;
    email: string;
    phone: number;
  };
  const clientHeight =
    document?.getElementsByClassName('react-flow')[0]?.clientHeight;
  const dispatch = useDispatch<AppDispatch>();
  const [data, setData] = useState<any>({});
  const saveState = (e: any) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  // todo : check preview mode
  const { messages } = useSelector((state: RootState) => state.preview);

  const [checkVisitor, setCheckVisitor] = useState(false);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleClearChat = async (e: any) => {
    dispatch(clearMessages());
    handleClose();
  };
  const handleRestartChat = (e: any) => {
    dispatch(clearMessages());
    setCheckVisitor(false);
    setLoading(false);
    handleClose();
  };
  const testBot = async (e: any) => {
    dispatch(clearMessages());
    setCheckVisitor(true);
    await dispatch(getBotDetails({ botId, data: {} }));
    setCheckVisitor(false);
    handleClose();
  };
  const renderContent = () => {
    if (messages && isChatStart) {
      if (messages.length === 0) {
        return (
          <Box
            sx={{
              flexGrow: 1,
              width: '100%',
              height: clientHeight - 90,
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
                bgcolor: botStyles?.primaryColor || '#fff',
                color: botStyles?.headerTextColor || '#000',
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
                    src={botStyles?.avatar || '/logo.jpeg'}
                    alt={'JarCube'}
                    sx={{ width: '2.375rem', height: '2.375rem' }}
                  />

                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: '0.875rem',
                        color: botStyles?.headerTextColor || '#000',
                      }}
                    >
                      {botName || 'JarCube'}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: botStyles?.headerTextColor || '#000',
                        opacity: 0.75,
                      }}
                    >
                      Handling by Bot
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <>
                  <Tooltip title="Close Chat" placement="top">
                    <IconButton
                      onClick={(e: any) => setIsBotOpen(false)}
                      size="small"
                      sx={{
                        color: botStyles?.primaryColor || 'text.secondary',
                        opacity: 8,
                      }}
                    >
                      <Icon
                        icon="mdi:minimize"
                        fontSize={28}
                        fontWeight="bold"
                      />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="More" placement="top">
                    <IconButton
                      id="more-option-button"
                      aria-controls={open ? 'more-option-menu' : undefined}
                      aria-haspopup="true"
                      aria-expanded={open ? 'true' : undefined}
                      onClick={handleClick}
                      size="small"
                      sx={{
                        color: botStyles?.headerTextColor || 'text.secondary',
                        opacity: 8,
                      }}
                    >
                      <Icon
                        icon="ic:outline-more-vert"
                        fontSize={25}
                        fontWeight="bold"
                      />
                    </IconButton>
                  </Tooltip>
                  <MoreOptions
                    anchorEl={anchorEl}
                    open={open}
                    handleClose={handleClose}
                    handleClearChat={handleClearChat}
                    handleRestartChat={handleRestartChat}
                  />
                </>
              </Box>
            </Box>
            <SendMsgForm
              updatemyMessages={updatemyMessages}
              visitorAccessToken={visitorAccessToken}
              socket={socket}
              botStyles={botStyles}
            />
          </Box>
        );
      } else {
        return (
          <Box
            sx={{
              width: '100%',
              height: clientHeight ? clientHeight - 170 : '70%',
              backgroundColor: '#fff',
              borderRadius: '5px',
              pb: 6,
            }}
          >
            <Box
              sx={{
                py: 3,
                px: 5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: botStyles?.primaryColor || '#fff',
                color: botStyles?.headerTextColor || '#000',
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
                    sx={{ mr: 2 }}
                    badgeContent={
                      <Box
                        component="span"
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          color: `paper.main`,
                          boxShadow: (theme) =>
                            `0 0 0 2px ${theme.palette.background.paper}`,
                          backgroundColor: `paper.main`,
                        }}
                      />
                    }
                  >
                    <MuiAvatar
                      src={botStyles?.avatar || '/logo.jpeg'}
                      alt={'JarCube'}
                      sx={{ width: '2.375rem', height: '2.375rem' }}
                    />
                  </Badge>
                  <Box sx={{ display: 'flex', flexDirection: 'column', ml: 2 }}>
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: '0.875rem',
                        color: botStyles?.headerTextColor || '#000',
                      }}
                    >
                      {botName || 'JarCube'}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: botStyles?.headerTextColor || '#000',
                        opacity: 0.75,
                      }}
                    >
                      Handling by Bot
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <>
                  <Tooltip title="Close Chat" placement="top">
                    <IconButton
                      onClick={(e: any) => setIsBotOpen(false)}
                      size="small"
                      sx={{
                        color: botStyles?.headerTextColor || 'text.secondary',
                        opacity: 8,
                      }}
                    >
                      <Icon
                        icon="mdi:minimize"
                        fontSize={28}
                        fontWeight="bold"
                      />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="More" placement="top">
                    <IconButton
                      id="more-option-button"
                      aria-controls={open ? 'more-option-menu' : undefined}
                      aria-haspopup="true"
                      aria-expanded={open ? 'true' : undefined}
                      onClick={handleClick}
                      size="small"
                      sx={{
                        color: botStyles?.headerTextColor || 'text.secondary',
                        opacity: 8,
                      }}
                    >
                      <Icon
                        icon="ic:outline-more-vert"
                        fontSize={25}
                        fontWeight="bold"
                      />
                    </IconButton>
                  </Tooltip>
                  <MoreOptions
                    anchorEl={anchorEl}
                    open={open}
                    handleClose={handleClose}
                    handleClearChat={handleClearChat}
                    handleRestartChat={handleRestartChat}
                  />
                </>
              </Box>
            </Box>

            <ChatLog
              hidden={hidden}
              botStyles={botStyles}
              updatemyMessages={updatemyMessages}
              socket={socket}
            />

            <SendMsgForm
              updatemyMessages={updatemyMessages}
              visitorAccessToken={visitorAccessToken}
              socket={socket}
              botStyles={botStyles}
            />
          </Box>
        );
      }
    } else {
      return (
        // add start button in center of the screen
        <Box
            sx={{
              flexGrow: 1,
              width: '100%',
              height: clientHeight - 90,
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
                bgcolor: botStyles?.primaryColor || '#fff',
                color: botStyles?.headerTextColor || '#000',
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
                    sx={{ mr: 2 }}
                    badgeContent={
                      <Box
                        component="span"
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          color: `paper.main`,
                          boxShadow: (theme) =>
                            `0 0 0 2px ${theme.palette.background.paper}`,
                          backgroundColor: `paper.main`,
                        }}
                      />
                    }
                  >
                    <MuiAvatar
                      src={botStyles?.avatar || '/logo.jpeg'}
                      alt={'JarCube'}
                      sx={{ width: '2.375rem', height: '2.375rem' }}
                    />
                  </Badge>
                  <Box sx={{ display: 'flex', flexDirection: 'column', ml: 2 }}>
                    <Typography
                      sx={{
                        fontWeight: 500,
                        fontSize: '0.875rem',
                        color: botStyles?.headerTextColor || '#000',
                      }}
                    >
                      {botName || 'JarCube'}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: botStyles?.headerTextColor || '#000',
                        opacity: 0.75,
                      }}
                    >
                      Handling by Bot
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <>
                  <Tooltip title="Close Chat" placement="top">
                    <IconButton
                      onClick={(e: any) => setIsBotOpen(false)}
                      size="small"
                      sx={{
                        color: botStyles?.headerTextColor || '#000',
                        opacity: 8,
                      }}
                    >
                      <Icon
                        icon="mdi:minimize"
                        color= {botStyles?.headerTextColor || '#000'}
                        fontSize={28}
                        fontWeight="bold"
                      />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="More" placement="top">
                    <IconButton
                      id="more-option-button"
                      aria-controls={open ? 'more-option-menu' : undefined}
                      aria-haspopup="true"
                      aria-expanded={open ? 'true' : undefined}
                      onClick={handleClick}
                      size="small"
                      sx={{
                        color: botStyles?.headerTextColor || 'text.secondary',
                        opacity: 8,
                      }}
                    >
                      <Icon
                        icon="ic:outline-more-vert"
                        fontSize={25}
                        fontWeight="bold"
                      />
                    </IconButton>
                  </Tooltip>
                  <MoreOptions
                    anchorEl={anchorEl}
                    open={open}
                    handleClose={handleClose}
                    handleClearChat={handleClearChat}
                    handleRestartChat={handleRestartChat}
                  />
                </>
              </Box>
            </Box>
            {/* add button in center */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
              }}
            >
              <Button
                variant="contained"
                sx={{
                  backgroundColor: botStyles?.primaryColor || '#fff',
                  color: botStyles?.headerTextColor || '#000',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  textTransform: 'none',
                  borderRadius: '5px',
                  '&:hover': {
                    backgroundColor: botStyles?.primaryColor || '#fff',
                    color: botStyles?.headerTextColor || '#000',
                  },
                }}
                onClick={handleStartPreview}
              >
                Start Chat
              </Button>
                </Box>
          </Box>

      )
    }
  };

  return renderContent();
};

export default ChatContent;
