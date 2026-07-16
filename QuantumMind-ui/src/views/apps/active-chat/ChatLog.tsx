// ** React Imports
import { ReactNode, Ref, useEffect, useRef } from 'react';

// ** MUI Imports
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
// ** Icon Imports

// ** Third Party Components
import PerfectScrollbarComponent, {
  ScrollBarProps
} from 'react-perfect-scrollbar';

// ** Custom Components Imports
import CustomAvatar from 'src/@core/components/mui/avatar';

// ** Utils Imports
import { useDispatch, useSelector } from 'react-redux';
import { getInitials } from 'src/@core/utils/get-initials';
import { AppDispatch, RootState } from 'src/store';
// ** Types Imports
import { Button, CircularProgress } from '@mui/material';
import {
  FormattedChatsType,
  MessageGroupType,
  MessageType
} from 'src/types/apps/chatTypes';
import Audio from '../components/Audio';
import Image from '../components/Images';
import Icon from 'src/@core/components/icon'

import Message from '../components/Message';
import Video from '../components/Video';
const PerfectScrollbar = styled(PerfectScrollbarComponent)<
  ScrollBarProps & { ref: Ref<unknown> }
>(({ theme }) => ({
  padding: theme.spacing(5),
}));

const ChatLog = (props: any) => {
  // ** Props
  const {isLoadingOldChat} = useSelector((state: RootState) => state.conversations);
  const { data, hidden, store, handleLoadOldChats } = props;
  const dispatch = useDispatch<AppDispatch>();
 
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
    let chatLog: MessageType[] = [];
    if (data.chats) {
      chatLog = data.chats;
    }

    const formattedChatLog: FormattedChatsType[] = [];
    let chatMessageSenderId = chatLog[0] ? chatLog[0].sender : 11;
    let msgGroup: MessageGroupType = {
      senderId: chatMessageSenderId,
      messages: [],
    };
    chatLog.forEach((msg: MessageType, index: number) => {
      if (chatMessageSenderId === msg.sender) {
        msgGroup.messages.push({
          time: msg.time,
          msg: msg.message || msg.value,
          feedback: msg?.feedback,
          type: msg.type,
          // intents: msg?.intents || [],
          sentiment: msg?.sentiment || null,
        });
      } else {
        chatMessageSenderId = msg.sender;

        formattedChatLog.push(msgGroup);
        msgGroup = {
          senderId: msg.sender,
          messages: [
            {
              time: msg.time,
              msg: msg.message || msg.value,
              feedback: msg?.feedback,
              type: msg.type,
              // intents: msg?.intents || [],
              sentiment: msg?.sentiment || null,
            },
          ],
        };
      }

      if (index === chatLog.length - 1) formattedChatLog.push(msgGroup);
    });
    return formattedChatLog;
  };

  useEffect(() => {
    if (data && data.chats && data.chats.length) {
      scrollToBottom();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // ** Renders user chat
  const renderChats = () => {
    return formattedChatData().map(
      (item: FormattedChatsType, index: number) => {
        const isSender = item.senderId !== data?.visitor?._id;

        return (
          <Box
            key={index}
            sx={{
              flexDirection: !isSender ? 'row' : 'row-reverse',
              mb: index !== formattedChatData().length - 1 ? 4 : undefined,
            }}
          >
            <div>
              <CustomAvatar
                skin="light"
                color={isSender ? 'primary' : 'secondary'}
                sx={{
                  width: '2rem',
                  height: '2rem',
                  fontSize: '0.875rem',
                  ml: isSender ? 3.5 : undefined,
                  mr: !isSender ? 3.5 : undefined,
                }}
                {...(data.visitor?.avatar && !isSender
                  ? {
                      src: data.contact?.avatar,
                      alt: data.visitor?.name,
                    }
                  : {})}
                {...(isSender
                  ? {
                      src: data?.userContact?.avatar,
                      alt: data.visitor.name,
                    }
                  : {})}
              >
                {data.contact?.avatarColor
                  ? getInitials(data.visitor.name)
                  : null}
              </CustomAvatar>
            </div>

            <Box
              className="chat-body"
              sx={{ maxWidth: ['calc(100% - 5.75rem)', '75%', '65%'] }}
            >
             
              {item.messages.map(
                (chat: any, index: number, { length }: { length: number }) => {
                  const time = new Date(chat.time);

                  return (
                    <Box
                      key={index}
                      sx={{ '&:not(:last-of-type)': { mb: 3.5 } }}
                    >
                      {chat.type === 'image' ? (
                        <Image isSender={isSender} image={chat.msg} />
                      ) : chat.type === 'video' ? (
                        <Video isSender={isSender} link={chat.msg} type="mp4" />
                      ) : chat.type === 'audio' ? (
                        <Audio isSender={isSender} link={chat.msg} />
                      ) : (
                        <div>
                        {chat.msg && chat.msg.length > 0 && (
                            <Message isSender={isSender} message={chat.msg} sentiment={chat?.sentiment || null} />
                          )}
                        </div>
                      )}
                      
                      {index + 1 === length ? (
                        <Box
                          sx={{
                            mt: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: isSender
                              ? 'flex-end'
                              : 'flex-start',
                          }}
                        >
                          {/* {renderMsgFeedback(isSender, chat?.feedback)} */}
                          <Typography variant="caption">
                            {time
                              ? new Date(time).toLocaleString('en-US', {
                                  hour: 'numeric',
                                  minute: 'numeric',
                                  hour12: true,
                                })
                              : null}
                          </Typography>
                        </Box>
                      ) : null}
                    </Box>
                  );
                },
              )}
            </Box>
          </Box>
        );
      },
    );
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
    <Box sx={{ height: 'calc(100% - 8.4375rem)' }}>
      <ScrollWrapper>
        {/* load old chat button */}
         {isLoadingOldChat ? 
         (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mt: 0,
              mb: 3,
              width: '100%',
              backgroundColor: '#f5f5f5',
              p: 2,
            }}
          >
            <CircularProgress size={20} />
          </Box>

         )
         :<Button 
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mt: 0,
              mb: 3,
              width: '100%',
              cursor: 'pointer',
              backgroundColor: '#f5f5f5',
              p: 2,
              textTransform:'unset'
            }}
            onClick={
              handleLoadOldChats}
              startIcon={
                <Icon icon='material-symbols:replay-circle-filled-rounded' width={20} height={20} />
              }
          >
           
              Load old chats
       
          </Button>}


        { renderChats()}</ScrollWrapper>
    </Box>
  );
};

export default ChatLog;

/**
 *
 *
 * formatedChatData()  => [
 * {senderId: "visitor", messages: Array(1)},
 * { senderId: "bot", messages: Array(1)},
 *]
 *
 *
 */
