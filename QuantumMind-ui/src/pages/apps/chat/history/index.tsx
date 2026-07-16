// ** React Imports
import { useEffect, useState } from 'react';

// ** MUI Imports
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// ** Store & Actions Imports
import { useDispatch, useSelector } from 'react-redux';
import { removeSelectedChat, sendMsg } from 'src/store/apps/chat';

// ** Types
import { AppDispatch, RootState } from 'src/store';
import { StatusObjType, StatusType } from 'src/types/apps/chatTypes';

// ** Hooks
import { useSettings } from 'src/@core/hooks/useSettings';

// ** Utils Imports
import { formatDateToMonthShort } from 'src/@core/utils/format';
import { getInitials } from 'src/@core/utils/get-initials';

// ** Chat App Components Imports
import { Grid } from '@mui/material';
import CardStatisticsHorizontal from 'src/@core/components/card-statistics/card-stats-horizontal';
import { CardStatsHorizontalProps } from 'src/@core/components/card-statistics/types';
import ChatContent from 'src/views/apps/chat/ChatContent';
import SidebarLeft from 'src/views/apps/chat/SidebarLeft';
// ** Actions Imports
import {
  getconversations, removedSelectedConversation, selectChat
} from 'src/store/apps/conversation';
import { getHistoryConversationStats } from 'src/store/apps/states';

const AppChat = () => {
  // ** States
  const [userStatus, setUserStatus] = useState<StatusType>('online');
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(false);
  const [userProfileLeftOpen, setUserProfileLeftOpen] =
    useState<boolean>(false);
  const [userProfileRightOpen, setUserProfileRightOpen] =
    useState<boolean>(false);
  const [createTicketRightOpen, setCreateTicketRightOpen] =
    useState<boolean>(false);
  const [questionBankRightOpen, setQuestionBankRightOpen] =
    useState<boolean>(false);

  // ** Hooks
  const theme = useTheme();
  const { settings } = useSettings();
  const dispatch = useDispatch<AppDispatch>();
  const hidden = useMediaQuery(theme.breakpoints.down('lg'));

  const store = useSelector((state: RootState) => state.conversations);

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

  const handleLeftSidebarToggle = () => setLeftSidebarOpen(!leftSidebarOpen);
  const handleUserProfileLeftSidebarToggle = () =>
    setUserProfileLeftOpen(!userProfileLeftOpen);
  const handleUserProfileRightSidebarToggle = () =>
    setUserProfileRightOpen(!userProfileRightOpen);
  const handleCreateTicketRightSidebarToggle = () =>
    setCreateTicketRightOpen(!createTicketRightOpen);
  const handleQuestionBankRightSidebarToggle = () =>
    setQuestionBankRightOpen(!questionBankRightOpen);
  useEffect(() => {
    dispatch(removedSelectedConversation());
  }, []);
  useEffect(() => {
    dispatch(getconversations());
  }, [dispatch]);
  const [historyStatsData, setHistoryStatsData] = useState<any>(null);
  const { history } = useSelector((state: RootState) => state.states);
  useEffect(() => {
    dispatch(getHistoryConversationStats());
  }, []);
  const avatarIcon: any = {
    total_chat: 'ph:chat-dots-fill',

    by_bot: 'ant-design:robot-filled',

    by_agent: 'material-symbols:support-agent',

    feedback: 'material-symbols:person-rounded',
  };
  useEffect(() => {
    if (history && history.length > 0) {
      let mapArr = history.map((item: any) => {
        return {
          ...item,
          stats: item.stats.toString(),
          avatarIcon: item.title.toLowerCase().includes('total')
            ? "/images/new/conversations/TOTAL_CONVERSATIONS.png"
            : item.title.toLowerCase().includes('bot')
            ? '/images/new/conversations/HANDELED_BY_BOT.png'
            : item.title.toLowerCase().includes('agent')
            ? '/images/new/conversations/HANDELED_BY_AGENT.png'
            : item.title.toLowerCase().includes('feedback')
            ? avatarIcon.feedback
            : 'ic:baseline-question-mark',
          avatarColor: item.title.toLowerCase().includes('total')
            ? 'warning'
            : item.title.toLowerCase().includes('agent')
            ? 'success'
            : item.title.toLowerCase().includes('bot')
            ? 'secondary'
            : 'primary',
        };
      });
      setHistoryStatsData(mapArr);
    }
  }, [history]);
  return (
    <>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          {historyStatsData && (
            <Grid container spacing={6}>
              {historyStatsData.map(
                (item: CardStatsHorizontalProps, index: number) => {
                  return (
                    <Grid
                      item
                      xs={12}
                      md={historyStatsData.length === 3 ? 4 : 3}
                      sm={6}
                      key={index}
                    >
                      <CardStatisticsHorizontal {...item} />
                    </Grid>
                  );
                },
              )}
            </Grid>
          )}
        </Grid>
      </Grid>
      <br />
      <Box
        className="app-chat"
        sx={{
          width: '100%',
          display: 'flex',
          height: '65vh',
          marginRight:'.5rem',
          position: 'relative',
        }}
      >
        <SidebarLeft
          store={store}
          hidden={hidden}
          mdAbove={mdAbove}
          dispatch={dispatch}
          statusObj={statusObj}
          userStatus={userStatus}
          selectChat={selectChat}
          getInitials={getInitials}
          sidebarWidth={sidebarWidth}
          setUserStatus={setUserStatus}
          leftSidebarOpen={leftSidebarOpen}
          removeSelectedChat={removeSelectedChat}
          userProfileLeftOpen={userProfileLeftOpen}
          formatDateToMonthShort={formatDateToMonthShort}
          handleLeftSidebarToggle={handleLeftSidebarToggle}
          handleUserProfileLeftSidebarToggle={
            handleUserProfileLeftSidebarToggle
          }
        />
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
          createTicketRightOpen={createTicketRightOpen}
          questionBankRightOpen={questionBankRightOpen}
          handleLeftSidebarToggle={handleLeftSidebarToggle}
          handleUserProfileRightSidebarToggle={
            handleUserProfileRightSidebarToggle
          }
          handleCreateTicketRightSidebarToggle={
            handleCreateTicketRightSidebarToggle
          }
          handleQuestionBankRightSidebarToggle={
            handleQuestionBankRightSidebarToggle
          }
        />
      </Box>
    </>
  );
};

AppChat.contentHeightFixed = false;

export default AppChat;
