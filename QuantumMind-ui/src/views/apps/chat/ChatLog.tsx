// ** React Imports
import { useRef, useEffect, Ref, ReactNode } from 'react';

// ** MUI Imports
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Third Party Components
import PerfectScrollbarComponent, {
  ScrollBarProps,
} from 'react-perfect-scrollbar';

// ** Custom Components Imports
import CustomAvatar from 'src/@core/components/mui/avatar';

// ** Utils Imports
import { getInitials } from 'src/@core/utils/get-initials';
import { Stack } from '@mui/material';
// ** Types Imports
import {
  ChatLogType,
  MessageType,
  MsgFeedbackType,
  ChatLogChatType,
  MessageGroupType,
  FormattedChatsType,
} from 'src/types/apps/chatTypes';
import Feedback from './Feedback';
import Image from '../components/Images';
import Video from '../components/Video';
import Audio from '../components/Audio';
import Message from '../components/Message';
const PerfectScrollbar = styled(PerfectScrollbarComponent)<
  ScrollBarProps & { ref: Ref<unknown> }
>(({ theme }) => ({
  padding: theme.spacing(5),
}));

const ChatLog = (props: any) => {
  // ** Props
  const { data, hidden } = props;

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

  const renderMsgFeedback = (isSender: boolean, feedback: MsgFeedbackType) => {
    if (isSender) {
      if (feedback?.isSent && !feedback?.isDelivered) {
        return (
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              '& svg': { mr: 2, color: 'text.secondary' },
            }}
          >
            <Icon icon="bx:check" fontSize="1rem" />
          </Box>
        );
      } else if (feedback?.isSent && feedback?.isDelivered) {
        return (
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              '& svg': {
                mr: 2,
                color: feedback.isSeen ? 'success.main' : 'text.secondary',
              },
            }}
          >
            <Icon icon="bx:check-all" fontSize="1rem" />
          </Box>
        );
      } else {
        return null;
      }
    }
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
      (
        item: FormattedChatsType,
        index: number,
        { length: chatLength }: { length: number },
      ) => {
        const isSender = item.senderId !== data?.visitor?._id;
        let chatIndex = index;
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
                      alt: data?.visitor?.name,
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
                        <Image isSender={isSender} image={chat?.msg} />
                      ) : chat.type === 'video' ? (
                        <Video
                          isSender={isSender}
                          link={chat.msg}
                          type={chat?.format || 'mp4'}
                        />
                      ) : chat.type === 'audio' ? (
                        <Audio isSender={isSender} link={chat.msg} />
                      ) : (
                        <div>
                          {chat.msg && chat.msg.length > 0 && (
                            <Message isSender={isSender} message={chat.msg} sentiment={chat?.sentiment || null} />
                          )}
                        </div>
                      )}
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
    <Box sx={{ height: 'calc(100% - 5.0rem)' }}>
      <ScrollWrapper>{renderChats()}</ScrollWrapper>
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
