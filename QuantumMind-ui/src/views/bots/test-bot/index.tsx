import React, { MutableRefObject } from 'react';
import ChatContent from 'src/views/bots/test-bot/chat/ChatContent';
import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import env from 'src/configs/environments';

// ** MUI Imports
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { IconButton } from '@mui/material';
// ** Store & Actions Imports
import { useDispatch, useSelector } from 'react-redux';
import { addMessage } from 'src/store/apps/preview';
import { useRouter } from 'next/router';
import {
  sendMsg,
  selectChat,
  fetchUserProfile,
  fetchChatsContacts,
  removeSelectedChat,
} from 'src/store/apps/chat';
import Icon from 'src/@core/components/icon';
import { ChatContext } from 'src/context/SocketContext';

// ** Types
import { RootState, AppDispatch } from 'src/store';
import { StatusObjType, StatusType } from 'src/types/apps/chatTypes';

// ** Hooks
import { useSettings } from 'src/@core/hooks/useSettings';
import io, { Socket } from 'socket.io-client';

// ** Utils Imports
import { getInitials } from 'src/@core/utils/get-initials';
import { formatDateToMonthShort } from 'src/@core/utils/format';
import Logo from 'src/@core/components/logo';
import axios from 'axios';
// ** Chat App Components Imports
import SidebarLeft from 'src/views/apps/chat/SidebarLeft';
type Props = {
  isChatBotOpen: boolean;
};

export default function index({ isChatBotOpen }: Props) {
  const chatContext = React.useContext(ChatContext);
  const [userStatus, setUserStatus] = useState<StatusType>('online');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(false);
  const [userProfileLeftOpen, setUserProfileLeftOpen] =
    useState<boolean>(false);
  const [userProfileRightOpen, setUserProfileRightOpen] =
    useState<boolean>(false);
  const [isBotOpen, setIsBotOpen] = useState(false);
  const socketRef = useRef<any>(null);
  const [messagesArray, setMessagesArray] = useState<any>([]);
  const [isVisitorId, setIsVisitorId] = useState(false);
  const [myMessages, setMyMessages] = useState<any>([]);
  const [visitorAccessToken, setVisitorAccessToken] = useState('');
  const router = useRouter();
  useEffect(() => {
    async function handleConnectSocket() {
      const serviceIP: string = env.baseurl;
      const botId = router.query.botId;
      const response: any = await axios.post(
        `${env.baseurl}/widget?botId=${botId}`,
      );
      if (response.data) {
        setVisitorAccessToken(response.data.accessToken);
        // const socket = io(serviceIP, {
        //   path: '/chat',
        //   auth: {
        //     token: response.data.accessToken,
        //   },
        // });
        // socketRef.current = socket;
        // socket.on('connect', () => {
        //   console.log('Connected', socket.id);
        // });

        // socket.on('chat-message-bot', (response: any) => {
        //   console.log({ 'Socket Response': response });
        //   //setMessagesArray((prev: any) => [...prev, response.message]);
        //   updatemyMessages(response.message);
        // });
        // socket.onAny((event: any, args: any) => {
        //   console.log(`Socket Event: ${event}`, args);
        // });
        // socket.on('disconnect', () => {
        //   console.log('Disconnected');
        // });

        socketRef.current = chatContext.init(response.data.accessToken);
        const observable = chatContext.onChatMessage();
        observable.subscribe((response: any) => {
          updatemyMessages(response.message);
        });
        setIsVisitorId(true);
      }
    }

    handleConnectSocket();

    return () => {
      socketRef?.current?.disconnect();
    };
  }, []);

  // ** Hooks
  const theme = useTheme();
  const { settings } = useSettings();
  const dispatch = useDispatch<AppDispatch>();
  const hidden = useMediaQuery(theme.breakpoints.down('lg'));
  // const store = useSelector((state: RootState) => state.chat)

  const store = {
    contacts: [
      {
        id: 3,
        fullName: 'Joaquina Weisenborn',
        role: 'Town planner',
        about:
          'Soufflé soufflé caramels sweet roll. Jelly lollipop sesame snaps bear claw jelly beans sugar plum sugar plum.',
        avatar: '/images/avatars/8.png',
        status: 'busy',
      },
      {
        id: 4,
        fullName: 'Verla Morgano',
        role: 'Data scientist',
        about:
          'Chupa chups candy canes chocolate bar marshmallow liquorice muffin. Lemon drops oat cake tart liquorice tart cookie. Jelly-o cookie tootsie roll halvah.',
        avatar: '/images/avatars/3.png',
        status: 'online',
      },
      {
        id: 5,
        fullName: 'Margot Henschke',
        role: 'Dietitian',
        avatarColor: 'success',
        about:
          'Cake pie jelly jelly beans. Marzipan lemon drops halvah cake. Pudding cookie lemon drops icing',
        status: 'busy',
      },
      {
        id: 6,
        fullName: 'Sal Piggee',
        role: 'Marketing executive',
        about:
          'Toffee caramels jelly-o tart gummi bears cake I love ice cream lollipop. Sweet liquorice croissant candy danish dessert icing. Cake macaroon gingerbread toffee sweet.',
        avatar: '/images/avatars/5.png',
        status: 'online',
      },
      {
        id: 7,
        fullName: 'Miguel Guelff',
        role: 'Special educational needs teacher',
        about:
          'Biscuit powder oat cake donut brownie ice cream I love soufflé. I love tootsie roll I love powder tootsie roll.',
        avatar: '/images/avatars/7.png',
        status: 'online',
      },
      {
        id: 8,
        fullName: 'Mauro Elenbaas',
        role: 'Advertising copywriter',
        about:
          'Bear claw ice cream lollipop gingerbread carrot cake. Brownie gummi bears chocolate muffin croissant jelly I love marzipan wafer.',
        avatar: '/images/avatars/6.png',
        status: 'away',
      },
      {
        id: 9,
        avatarColor: 'warning',
        fullName: 'Bridgett Omohundro',
        role: 'Designer, television/film set',
        about:
          'Gummies gummi bears I love candy icing apple pie I love marzipan bear claw. I love tart biscuit I love candy canes pudding chupa chups liquorice croissant.',
        status: 'offline',
      },
      {
        id: 10,
        avatarColor: 'error',
        fullName: 'Zenia Jacobs',
        role: 'Building surveyor',
        about:
          'Cake pie jelly jelly beans. Marzipan lemon drops halvah cake. Pudding cookie lemon drops icing',
        status: 'away',
      },
    ],
    userProfile: {
      id: 11,
      avatar: '/images/avatars/1.png',
      fullName: 'John Doe',
      role: 'user',
      about:
        'Dessert chocolate cake lemon drops jujubes. Biscuit cupcake ice cream bear claw brownie brownie marshmallow.',
      status: 'online',
      settings: {
        isTwoStepAuthVerificationEnabled: true,
        isNotificationsOn: false,
      },
    },
    selectedChat: {
      chat: {
        id: 1,
        userId: 1,
        unseenMsgs: 0,
        chat: [
          {
            message: "How can we help? We're here for you!",
            time: 'Mon Dec 10 2018 07:45:00 GMT+0000 (GMT)',
            senderId: 11,
            feedback: {
              isSent: true,
              isDelivered: true,
              isSeen: true,
            },
          },
          {
            message:
              'Hey John, I am looking for the best admin template. Could you please help me to find it out?',
            time: 'Mon Dec 10 2018 07:45:23 GMT+0000 (GMT)',
            senderId: 1,
            feedback: {
              isSent: true,
              isDelivered: true,
              isSeen: true,
            },
          },
          {
            message: 'It should be MUI v5 compatible.',
            time: 'Mon Dec 10 2018 07:45:55 GMT+0000 (GMT)',
            senderId: 1,
            feedback: {
              isSent: true,
              isDelivered: true,
              isSeen: true,
            },
          },
          {
            message: 'Absolutely!',
            time: 'Mon Dec 10 2018 07:46:00 GMT+0000 (GMT)',
            senderId: 11,
            feedback: {
              isSent: true,
              isDelivered: true,
              isSeen: true,
            },
          },
          {
            message: 'This admin template is built with MUI!',
            time: 'Mon Dec 10 2018 07:46:05 GMT+0000 (GMT)',
            senderId: 11,
            feedback: {
              isSent: true,
              isDelivered: true,
              isSeen: true,
            },
          },
          {
            message: 'Looks clean and fresh UI. 😍',
            time: 'Mon Dec 10 2018 07:46:23 GMT+0000 (GMT)',
            senderId: 1,
            feedback: {
              isSent: true,
              isDelivered: true,
              isSeen: true,
            },
          },
          {
            message: "It's perfect for my next project.",
            time: 'Mon Dec 10 2018 07:46:33 GMT+0000 (GMT)',
            senderId: 1,
            feedback: {
              isSent: true,
              isDelivered: true,
              isSeen: true,
            },
          },
          {
            message: 'How can I purchase it?',
            time: 'Mon Dec 10 2018 07:46:43 GMT+0000 (GMT)',
            senderId: 1,
            feedback: {
              isSent: true,
              isDelivered: true,
              isSeen: true,
            },
          },
          {
            message: 'Thanks, From our official site  😇',
            time: 'Mon Dec 10 2018 07:46:53 GMT+0000 (GMT)',
            senderId: 11,
            feedback: {
              isSent: true,
              isDelivered: true,
              isSeen: true,
            },
          },
          {
            message: 'I will purchase it for sure. 👍',
            time: '2022-11-14T08:40:40.517Z',
            senderId: 1,
            feedback: {
              isSent: true,
              isDelivered: true,
              isSeen: true,
            },
          },
        ],
      },
      contact: {
        id: 1,
        fullName: 'Felecia Rower',
        role: 'Frontend Developer',
        about:
          'Cake pie jelly jelly beans. Marzipan lemon drops halvah cake. Pudding cookie lemon drops icing',
        avatar: '/images/avatars/2.png',
        status: 'offline',
        chat: {
          id: 1,
          unseenMsgs: 0,
          lastMessage: {
            message: 'I will purchase it for sure. 👍',
            time: '2022-11-14T08:40:40.517Z',
            senderId: 1,
            feedback: {
              isSent: true,
              isDelivered: true,
              isSeen: true,
            },
          },
        },
      },
    },
  };
  useEffect(() => {
    setIsBotOpen(isChatBotOpen);
  }, [isChatBotOpen]);
  // ** Vars
  const { skin } = settings;
  const smAbove = useMediaQuery(theme.breakpoints.up('sm'));
  const sidebarWidth = smAbove ? 370 : 300;
  const mdAbove = useMediaQuery(theme.breakpoints.up('md'));
  const statusObj: StatusObjType = {
    busy: 'error',
    away: 'warning',
    online: 'success',
    offline: 'secondary',
  };

  useEffect(() => {
    dispatch(fetchUserProfile());
    dispatch(fetchChatsContacts());
  }, [dispatch]);

  const updatemyMessages = (message: any) => {
    dispatch(addMessage(message));
  };

  const handleLeftSidebarToggle = () => setLeftSidebarOpen(!leftSidebarOpen);
  const handleUserProfileLeftSidebarToggle = () =>
    setUserProfileLeftOpen(!userProfileLeftOpen);
  const handleUserProfileRightSidebarToggle = () =>
    setUserProfileRightOpen(!userProfileRightOpen);
  const ele = document?.getElementsByClassName('react-flow')[0]?.clientHeight;

  return (
    <div>
      {isBotOpen ? (
        <div
          style={{
            zIndex: 100,
            position: 'absolute',
            right: 10,
            bottom: 10,
            borderRadius: '10%',
            height: ele - 100,
            width: 360,
          }}
        >
          <ChatContent
            store={store}
            hidden={hidden}
            sendMsg={sendMsg}
            mdAbove={mdAbove}
            dispatch={dispatch}
            statusObj={statusObj}
            getInitials={getInitials}
            sidebarWidth={sidebarWidth}
            userProfileRightOpen={userProfileRightOpen}
            handleLeftSidebarToggle={handleLeftSidebarToggle}
            handleUserProfileRightSidebarToggle={
              handleUserProfileRightSidebarToggle
            }
            setIsBotOpen={setIsBotOpen}
            socket={socketRef.current}
            messagesArray={messagesArray}
            setMessagesArray={setMessagesArray}
            updatemyMessages={updatemyMessages}
            myMessages={myMessages}
            visitorAccessToken={visitorAccessToken}
          />
        </div>
      ) : (
        <div style={{ position: 'absolute', right: 10, bottom: 10 }}>
          <IconButton
            sx={{ p: 4, backgroundColor: '#fff', boxShadow: '0 0 5px grey' }}
            onClick={() => setIsBotOpen(true)}
          >
            <Icon icon="material-symbols:chat" fontSize={25} color="#00a7ff" />
          </IconButton>
        </div>
      )}
    </div>
  );
}
