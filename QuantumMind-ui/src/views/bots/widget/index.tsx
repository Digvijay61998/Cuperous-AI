import { useEffect, useRef, useState, useContext } from 'react';
import ChatContent from './chat/ChatContent';

// ** MUI Imports
import { IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { addMessage } from 'src/store/apps/preview';
import { ChatContext } from 'src/context/SocketContext';

import { Icon } from '@iconify/react';

// ** Types
import { AppDispatch, RootState } from 'src/store';
import { getBotDetails } from 'src/store/apps/widget-preview/widget';
import { getBotMetadata, fetchVisitor } from 'src/store/apps/preview';
// ** Utils Imports

type Props = {
  isChatBotOpen: boolean;
};

export default function Index({ isChatBotOpen }: Props) {
  const chatContext = useContext(ChatContext);
  const [isBotOpen, setIsBotOpen] = useState(false);
  const socketRef = useRef<any>(null);
  const { botId } = useRouter().query;
  const [isVisitorId, setIsVisitorId] = useState(false);
  const [visitorAccessToken, setVisitorAccessToken] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(true);
const [messageArray, setMessageArray] = useState<any>([])
const [isChatStart, setIsChatStart] = useState<boolean>(false)
  const { accessToken, botStyles, botSettings, botName, widgetToken } =
    useSelector((state: RootState) => state.preview);

  useEffect(() => {
    if (botId) {
      dispatch(getBotMetadata(botId));
    }
  }, [botId, dispatch]);
  useEffect(() => {
    if (botId && widgetToken) {
      dispatch(
        fetchVisitor({
          botId,
          token: widgetToken,
          data: {
            name: 'Preview',
            email: `preview@${botId}.com`,
            phone: '1234567890',
            mode: 'preview',
          },
        }),
      );
    }
  }, [dispatch, botId, widgetToken]);

const handleStartPreview = () => {
  if (accessToken) {
    setLoading(true);
    setIsChatStart(true);
    socketRef.current = chatContext.init(accessToken);
    const observable = chatContext.onChatMessage();
    observable.subscribe((response: any) => {
      updatemyMessages(response.message);
    });
    setLoading(false);
  }
  return () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };
}

  useEffect(() => {
    setIsBotOpen(isChatBotOpen);
  }, [isChatBotOpen]);

  const mdAbove = true;
  const statusObj: any = {
    busy: 'error',
    away: 'warning',
    online: 'success',
    offline: 'secondary',
  };

  const updatemyMessages = (message: any) => {
    dispatch(addMessage(message));
  };
  const theme = useTheme();

  const hidden = useMediaQuery(theme.breakpoints.down('lg'));

  const clientHeight =
    document?.getElementsByClassName('react-flow')[0]?.clientHeight;
  return (
    <div>
      {isBotOpen ? (
        <div
          style={{
            zIndex: 100,
            position: 'absolute',
            right: 10,
            bottom: 10,
            borderRadius: '10px',
            height: clientHeight - 90,
            width: 400,
            backgroundColor: '#fff',
          }}
        >
          <ChatContent
            hidden={hidden}
            mdAbove={mdAbove}
            statusObj={statusObj}
            setIsBotOpen={setIsBotOpen}
            socket={socketRef.current}
            updatemyMessages={updatemyMessages}
            visitorAccessToken={visitorAccessToken}
            botSettings={botSettings}
            botStyles={botStyles}
            botName={botName}
            botId={botId}
            loading={loading}
            setLoading={setLoading}
            isChatStart={isChatStart}
            setIsChatStart={setIsChatStart}
            handleStartPreview={handleStartPreview}
          />
        </div>
      ) : (
        <div style={{ position: 'absolute', right: 20, bottom: 40 }}>
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
