// ** React Imports
import {
  forwardRef,
  ReactElement,
  ReactNode,
  Ref,
  useEffect,
  useRef,
  useState,
} from 'react';

// ** MUI Imports
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import { deepOrange, deepPurple } from '@mui/material/colors';
import IconButton from '@mui/material/IconButton';
import Slide from '@mui/material/Slide';
import { styled } from '@mui/material/styles';
import Toolbar from '@mui/material/Toolbar';
import { TransitionProps } from '@mui/material/transitions';
// ** Icon Imports
import { Icon } from '@iconify/react';
// ** Third Party Components
import PerfectScrollbarComponent, {
  ScrollBarProps,
} from 'react-perfect-scrollbar';

// ** Custom Components Imports

// ** Utils Imports
import ButtonsReply from './components/ButtonsReply';
import Image from './components/Image';
import Message from './components/Message';
import QuickReply from './components/QuickReply';
// ** Types Imports
import { useSelector } from 'react-redux';
import { RootState } from 'src/store';
import Alert from '@mui/material/Alert';
// ** Utils Imports
import Audio from "./components/Audio";
import Feedback from "./components/Feedback";
import Gallery from "./components/Gallery";
// ** Types Imports

import Map from "./components/Map";
import TemplateLaunch from "./components/TemplateLaunch";
import Video from "./components/Video";
const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: ReactElement;
  },
  ref: Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const PerfectScrollbar = styled(PerfectScrollbarComponent)<
  ScrollBarProps & { ref?: Ref<unknown> }
>(({ theme }) => ({
  padding: theme.spacing(1),
}));

// Module-level so its identity is stable across renders. Defined inside the
// component it remounted the scroll box on every render, resetting scrollTop.
const ScrollWrapper = forwardRef<any, { hidden: boolean; children: ReactNode }>(
  ({ hidden, children }, ref) =>
    hidden ? (
      <Box
        ref={ref}
        sx={{ p: 2, height: '100%', overflowY: 'auto', overflowX: 'hidden' }}
      >
        {children}
      </Box>
    ) : (
      <PerfectScrollbar ref={ref} options={{ wheelPropagation: false }}>
        {children}
      </PerfectScrollbar>
    ),
);

const ChatLog = (props: any) => {
  // ** Props
  const { hidden, botStyles,  } = props;

  const { messages: messageArray } = useSelector(
    (state: RootState) => state.preview,
  );

  const { visitorId } = useSelector((state: RootState) => state.widgetPreview);

  // ** Ref
  const chatArea = useRef(null);

  // ** Scroll to chat bottom
  const scrollToBottom = () => {
    // Scroll only the chat container. Never use scrollIntoView here: it also
    // scrolls every scrollable ancestor (flow canvas, page), which shoved the
    // whole flow builder up when messages arrived.
    requestAnimationFrame(() => {
      const el: any = chatArea.current;
      const box: HTMLElement | null = el?._container ?? el;
      if (box) box.scrollTop = box.scrollHeight;
    });
  };
  // ** Formats chat data based on sender
  const formattedChatData = () => {
    let chatLog: any = [];
    if (messageArray.length) {
      chatLog = messageArray;
    }

    const formattedChatLog: any[] = [];
    // Seed with the first message's sender so we don't emit an empty leading
    // group (which rendered a stray avatar with no messages).
    let chatMessageSenderId = chatLog[0]?.senderId ?? 'preview_visitor';
    let msgGroup: any = {
      senderId: chatMessageSenderId,
      messages: [],
    };
    chatLog.forEach((msg: any, index: number) => {
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

      if (index === chatLog.length - 1) formattedChatLog.push(msgGroup);
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
      const isSender = item.senderId === 'preview_visitor';
      return (
        <Box
          key={index}
          sx={{
            display: 'flex',
            flexDirection: !isSender ? 'row' : 'row-reverse',
            mb: index !== formattedChatData().length - 1 ? 4 : undefined,
            mt: 1.5,
          }}
        >
          <div>
            <Avatar
              alt={isSender ? 'V' : 'B'}
              sx={{
                width: 30,
                height: 30,
                m: 1,
                mt: -2,
                p: 1,
                bgcolor: isSender ? deepPurple[500] : deepOrange[500],
                color:"#fff"
              }}
              src={isSender ? 'V' : 'B'}
            />
          </div>

          <Box
            className="chat-body"
            sx={{ maxWidth: ['calc(100% - 1.75rem)', '90%', '90 %'] }}
          >
            {item.messages.map((chat: any, index: number) => {
              if (chat.type === 'random_text') {
              }
              return (
                <Box key={index} sx={{ '&:not(:last-of-type)': { mb: 3.5 } }}>
                  <div>
                    {chat.info && (
                      <Alert severity={chat.info}>{chat.value}</Alert>
                    )}
                    {chat.type === 'text' &&
                      !chat?.info &&
                      chat?.value &&
                      chat?.value.length > 0 && (
                        <Message
                          isSender={isSender}
                          botStyles={botStyles}
                          message={chat.value}
                        />
                      )}

                    {chat.type === 'buttons' && (
                      <ButtonsReply
                        socket={props.socket}
                        updatemyMessages={props.updatemyMessages}
                        botStyles={botStyles}
                        isSender={isSender}
                        buttons={chat.buttons || []}
                        message={chat.value || ''}
                        handleButtonFunction={handleButtonFunction}
                      />
                    )}
                    {chat.type === 'quick_reply' && (
                      <QuickReply
                        botStyles={botStyles}
                        socket={props.socket}
                        updatemyMessages={props.updatemyMessages}
                        isSender={isSender}
                        buttons={chat.buttons || []}
                        message={chat.value || ''}
                        handleButtonFunction={handleButtonFunction}
                      />
                    )}
                    {chat.type === 'image' && (
                      <Image isSender={isSender} image={chat.value || ''} />
                    )}
                    {chat.type === 'audio' && <Audio link={chat.value} />}
                    {chat.type === 'video' && (
                      <Video link={chat.value} type={chat.format || 'mp4'} />
                    )}
                    {chat.type === 'maps' && <Map location={chat.location} />}
                    {chat.type === 'template' && chat.template?.url && (
                      <TemplateLaunch
                        isSender={isSender}
                        botStyles={botStyles}
                        message={chat.value || ''}
                        url={chat.template.url}
                        buttonText={chat.template.buttonText || 'Open'}
                      />
                    )}
                    <div style={{ width: '100%', marginLeft: '-1rem' }}>
                      {chat.type === 'gallery' && (
                        <Gallery galleryArray={chat?.buttons} {...props} />
                      )}
                    </div>
                  </div>
                </Box>
              );
            })}
          </Box>
        </Box>
      );
    });
  };


  return (
    <>
      <Box sx={{ height: 'calc(100% - 2.4375rem)' }}>
        <ScrollWrapper hidden={hidden} ref={chatArea}>{renderChats()}</ScrollWrapper>
      </Box>
    </>
  );
};

export default ChatLog;
