// ** React Imports
import {
  forwardRef, ReactElement, ReactNode, Ref, useEffect, useRef, useState
} from 'react';

// ** MUI Imports
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import Slide from '@mui/material/Slide';
import { styled } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import { TransitionProps } from '@mui/material/transitions';

// ** Icon Imports
import Icon from 'src/@core/components/icon';
// ** Third Party Components
import PerfectScrollbarComponent, {
  ScrollBarProps
} from 'react-perfect-scrollbar';

// ** Custom Components Imports
import CustomAvatar from 'src/@core/components/mui/avatar';

// ** Utils Imports
import { getInitials } from 'src/@core/utils/get-initials';
import ButtonsReply from './components/ButtonsReply';
import Image from './components/Image';
import Message from './components/Message';
import QuickReply from './components/QuickReply';
// ** Types Imports

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: ReactElement;
  },
  ref: Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const PerfectScrollbar = styled(PerfectScrollbarComponent)<
  ScrollBarProps & { ref: Ref<unknown> }
>(({ theme }) => ({
  padding: theme.spacing(1),
}));

type ChatLogType = {
  hidden: boolean;
  data: any;
};
const ChatLog = (props: any) => {
  // ** Props
  const { data, hidden,
    primaryColor,
    buttonColor,
    buttonTextColor,
    botName } = props;

  data.setting = {
    botName: 'Engage Bot',
    avatar: '/logo.jpeg',
    isSoundOn: false,
  };
  data.contact = {
    avatarColor: 'success',
    fullName: 'Agent 101',
    id: 10,
    role: 'Building surveyor',
    status: 'online',
    avatar: '/images/avatars/8.png',
  };
  data.visitorData = {
    id: 121,
    avatar: '/images/avatars/1.png',
    name: 'John Doe',
    email: 'visitor@gmail.com',
    role: 'visitor',
    status: 'online',
  };
  const messageArray: any = [
    {
      "value": "hi",
      "type": "text",
      "senderId": "visitor_id_1010",
      "time": "2022-11-24T02:48:57.631Z",
      "id": 1669258137631
    },
    {
      "id": "637edb99d7f478f1ef88f47d",
      "senderId": "637da09bc0bb736d823e9c33",
      "value": "/images/cards/analog-clock.jpg",
      "type": "image",
      "time": "2022-11-24T02:48:57.781Z",
      "buttons": []
    },
    {
      "id": "637edb99d7f478f1ef88f47c",
      "senderId": "637da09bc0bb736d823e9c33",
      "value": "Hi(👋 ) How can I help you",
      "type": "text",
      "time": "2022-11-24T02:48:57.779Z",
      "buttons": []
    },
    {
      "id": "637edb99d7f478f1ef88f47e",
      "senderId": "637da09bc0bb736d823e9c33",
      "value": "Checkout our services",
      "type": "buttons",
      "time": "2022-11-24T02:48:57.782Z",
      "buttons": [
        {
          "title": "Visit us",
          "type": "url",
          "value": "https://abc.com"
        },
        {
          "title": "Call us",
          "type": "phone",
          "value": "8177978087"
        }
      ]
    },
    {
      "value": "hi",
      "type": "text",
      "senderId": "visitor_id_1010",
      "time": "2022-11-24T02:49:03.117Z",
      "id": 1669258143117
    },
    {
      "id": "637edb9fd7f478f1ef88f48b",
      "senderId": "637da09bc0bb736d823e9c33",
      "value": "What you looking for?",
      "type": "text",
      "time": "2022-11-24T02:49:03.320Z",
      "buttons": []
    },
    {
      "id": "637edb9fd7f478f1ef88f48a",
      "senderId": "637da09bc0bb736d823e9c33",
      "value": "Happy to help you",
      "type": "text",
      "time": "2022-11-24T02:49:03.317Z",
      "buttons": []
    }
  ]
  // ** Ref
  const chatArea = useRef(null);

  // ** Scroll to chat bottom
  const scrollToBottom = () => {
    if (chatArea.current) {
      if (hidden) {
        // @ts-ignore
        chatArea.current.scrollTop = Number.MAX_SAFE_INTEGER;
      } else {
        // @ts-ignore
        chatArea.current._container.scrollTop = Number.MAX_SAFE_INTEGER;
      }
    }
  };
  // ** Formats chat data based on sender
  const formattedChatData = () => {
    let chatLog: any = [];
    if (messageArray.length) {
      chatLog = messageArray;
    }

    const formattedChatLog: any[] = [];
    let chatMessageSenderId = messageArray[0]?.senderId
      ? messageArray[0].senderId
      : 'bot';
    let msgGroup: any = {
      senderId: chatMessageSenderId,
      messages: [],
    };
    chatLog.forEach((msg: any, chatIndex: number) => {
      if (chatMessageSenderId === msg.senderId) {
        msgGroup.messages.push(msg);
      } else {
        chatMessageSenderId = msg.senderId;

        formattedChatLog.push(msgGroup);
        msgGroup = {
          senderId: chatMessageSenderId,
          messages: [msg],
        };
      }

      if (chatIndex === chatLog.length - 1) formattedChatLog.push(msgGroup);
    });

    return formattedChatLog;
  };

  useEffect(() => {
    if (messageArray && messageArray.length) {
      scrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageArray]);

  const [openWebView, setOpenWebView] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState('');
  const handleCloseWebView = () => {
    setOpenWebView(false);
  };

  function handleButtonFunction(type: string, value: string) {
    if (type === 'webview') {
      setWebViewUrl(value);
      setOpenWebView(true);
    }
  }

  const renderChats = () => {
    return formattedChatData().map((item: any, index: number) => {
      const isSender = item.senderId === 'visitor_id_1010';
      document.getElementById('scrollToBottom')?.scrollIntoView({
        behavior: 'smooth'
      });
      return (
        <Box
          key={index}
          sx={{
            display: 'flex',
            flexDirection: !isSender ? 'row' : 'row-reverse',
            mb: index !== formattedChatData().length - 1 ? 4 : undefined,
          }}
        >
          <div>
            <CustomAvatar
              skin="filled"
              color={
                data.contact.avatarColor ? data.contact.avatarColor : undefined
              }
              sx={{
                width: '1.3rem',
                height: '1.3rem',
                fontSize: '0.875rem',
                ml: isSender ? 2.2 : undefined,
                mr: !isSender ? 2.2 : undefined,
              }}
              {...(data.contact.avatar && !isSender
                ? {
                  src: data.contact.avatar,
                  alt: data.contact.fullName,
                }
                : {})}
              {...(isSender
                ? {
                  src: data.userContact.avatar,
                  alt: 'Visitor',
                }
                : {})}
            >
              {data.contact.avatarColor
                ? getInitials(data.contact.fullName)
                : null}
            </CustomAvatar>
          </div>

          <Box
            className="chat-body"
            sx={{ maxWidth: ['calc(100% - 1.75rem)', '90%', '90 %'] }}
          >
            {item && item.messages.map((chat: any, indexNumber: number) => {
              return (
                <Box key={indexNumber} sx={{ '&:not(:last-of-type)': { mb: 3.5 } }}>
                    {chat.type === 'text' && (
                      <Message isSender={isSender} message={chat.value} {...props}/>
                    )}
                    {chat.type === 'buttons' && (
                      <ButtonsReply
                        isSender={isSender}
                        buttons={chat.buttons || []}
                        message={chat.value || ''}
                        handleButtonFunction={handleButtonFunction}
                        {...props}
                      />
                    )}
                    {chat.type === 'quick_reply' && <QuickReply {...props} />}
                    {chat.type === 'image' && (
                      <Image isSender={isSender} image={chat.value || ''} />
                    )}

                </Box>
              );
            })}
          </Box>
        </Box>
      );
    });
  };

  const ScrollWrapper = ({ children }: { children: ReactNode }) => {
    if (hidden) {
      return (
        <Box
          ref={chatArea}
          sx={{ p: 5, height: '100%', overflowY: 'auto', overflowX: 'hidden' }}
        >
          {children}
        </Box>
      );
    } else {
      return (
        <PerfectScrollbar ref={chatArea} options={{ wheelPropagation: false }}>
          {children}
        </PerfectScrollbar>
      );
    }
  };

  return (
    <>

      <Box sx={{ height: 'calc(100% - 8.4375rem)' }}>
        <ScrollWrapper>{renderChats()}</ScrollWrapper>
        <span id="scrollToBottom"> </span>
      </Box>

      {/* webview dialog with full screen */}
      <Dialog
        fullScreen
        open={openWebView}
        onClose={handleCloseWebView}
        TransitionComponent={Transition}
      >
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton
              autoFocus
              edge="start"
              color="inherit"
              onClick={handleCloseWebView}
              aria-label="close"
            >
              <Icon icon="material-symbols:close-rounded" fontSize={20} />
            </IconButton>
          </Toolbar>
        </AppBar>
        {/* <iframe src={webViewUrl} frameBorder="0" /> */}
      </Dialog>
    </>
  );
};

export default ChatLog;
