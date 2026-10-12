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
import CardStatisticsHorizontal from 'src/@core/components/card-statistics/card-stats-horizontal';
import { CardStatsHorizontalProps } from 'src/@core/components/card-statistics/types';
import ChatContent from 'src/views/apps/active-chat/ChatContent';
import SidebarLeft from 'src/views/apps/active-chat/SidebarLeft';

// import { addMessage, addVisitor } from 'src/store/apps/conversation';
// ** Actions Imports
import { Grid } from '@mui/material';
import {
  addActiveMessage,
  clearActiveMessage, selectChat, updateActiveConversation
} from 'src/store/apps/conversation';
import { saveSoundPrefs } from 'src/store/apps/alerts';
import { currentAlertClient } from 'src/services/alerts/alertClient';
import {
  LIVE_CHAT_TAB,
  markInboxThreadRead,
  selectInboxThread,
  setInboxTab,
} from 'src/store/apps/inbox';
import { useRouter } from 'next/router';
import { getActiveConversationStats } from 'src/store/apps/states';
import ChannelInbox from 'src/views/apps/inbox/ChannelInbox';
import ChannelTabs from 'src/views/apps/inbox/ChannelTabs';
import Axios from 'src/helper/Axios';
import { toast } from 'react-hot-toast';
import {
  AGENT_VIEW_CONVERSATION_PARAM,
  isConversationId,
  resolveAgentViewTarget,
} from 'src/views/crm/contactLinks';

const AppChat = ({props}: any) => {
  const store = useSelector((state: RootState) => state.conversations);
  const { chatContext } = useSelector((state: RootState) => state.conversations);
  const router = useRouter();
  const soundPrefs = useSelector((state: RootState) => state.alerts.prefs);
  const enableSound = soundPrefs.handoverSound || soundPrefs.messageSound;
  const { activeTab } = useSelector((state: RootState) => state.inbox);


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

  // Deep link from a handover alert: /apps/chat/active?channel=widget&thread=<id>
  useEffect(() => {
    const channel = typeof router.query.channel === 'string' ? router.query.channel : '';
    const thread = typeof router.query.thread === 'string' ? router.query.thread : '';
    if (!channel || !thread) return;
    dispatch(setInboxTab(channel));
    dispatch(selectInboxThread(thread));
    dispatch(markInboxThreadRead(thread));
    void router.replace('/apps/chat/active', undefined, { shallow: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query.channel, router.query.thread]);

  // Deep link from a CRM contact: /apps/chat/active?conversation=<conversationId>.
  // Only the conversation record knows its inbox thread, so resolve it here.
  useEffect(() => {
    const raw = router.query[AGENT_VIEW_CONVERSATION_PARAM];
    const conversationId = typeof raw === 'string' ? raw : '';
    if (!isConversationId(conversationId)) return;
    let cancelled = false;

    (async () => {
      try {
        const { data } = await Axios.get(`/conversation/${conversationId}`);
        if (cancelled) return;
        const target = resolveAgentViewTarget(data);
        if (target.kind === 'thread') {
          const { data: thread } = await Axios.get(
            `/inbox/threads/${encodeURIComponent(target.threadId)}`,
          );
          if (cancelled || !thread?.channel) return;
          dispatch(setInboxTab(thread.channel));
          dispatch(selectInboxThread(target.threadId));
          dispatch(markInboxThreadRead(target.threadId));
        } else if (target.kind === 'live') {
          dispatch(setInboxTab(LIVE_CHAT_TAB));
          dispatch(addActiveMessage({ id: target.conversationId, visitorId: target.visitorId }));
        } else if (target.kind === 'visitor') {
          void router.replace(`/visitors/view/${encodeURIComponent(target.visitorId)}`);
          return;
        } else {
          toast.error('This conversation is no longer available.');
        }
      } catch {
        if (!cancelled) toast.error('Could not open this conversation.');
      }
      if (!cancelled) void router.replace('/apps/chat/active', undefined, { shallow: true });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.query[AGENT_VIEW_CONVERSATION_PARAM]]);

  // ** Vars
  const {mode, skin } = settings;
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

  const [activeStatsData, setActiveStatsData] = useState<any>(null);
  const { activeStats } = useSelector((state: RootState) => state.states);
  const [updateStats, setUpdateStats] = useState<boolean>(false);
  useEffect(() => {
    if (dispatch) dispatch(getActiveConversationStats());
  }, [dispatch, updateStats]);
  const avatarIcon: any = {
    total_active: 'ph:chats-duotone',

    my_active: 'openmoji:chats',

    my_anonymous: 'mdi:anonymous',

    my_named: 'material-symbols:person-rounded',
  };
  useEffect(() => {
    if (activeStats && activeStats.length > 0) {
      let mapArr = activeStats.map((item: any) => {
        return {
          ...item,
          stats: item.stats.toString(),
          avatarIcon: item.title.toLowerCase().includes('total')
            ? "/images/new/active/TOTAL_ACTIVE.png"
            : item.title.toLowerCase().includes('my active')
            ? "/images/new/active/MY_ACTIVE.png"
            : item.title.toLowerCase().includes('my anonymous')
            ? "/images/new/active/ANONYMUS.png"
            : item.title.toLowerCase().includes('my named')
            ? "/images/new/active/MY_NAMED.png"
            : 'ic:baseline-question-mark',
          avatarColor: item.title.toLowerCase().includes('total')
            ? 'warning'
            : item.title.toLowerCase().includes('active')
            ? 'success'
            : item.title.toLowerCase().includes('named')
            ? 'secondary'
            : 'primary',
            mode:mode,
        };
      });
      setActiveStatsData(mapArr);
    }
  }, [activeStats]);
// The legacy Mute button now drives the persisted per-user sound prefs
// (both the handover alert and the soft message notification).
const handleToggleSound = () => {
    const next = !enableSound;
    const value = { handoverSound: next, messageSound: next };
    dispatch(saveSoundPrefs({ next: value, previous: soundPrefs })).then((r: any) => {
      if (saveSoundPrefs.fulfilled.match(r)) currentAlertClient()?.broadcastPrefs(r.payload);
    });
}
console.log(activeStatsData,"activestats")
  return (
    <>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          {activeStatsData && (
            <Grid container spacing={6}>
              {activeStatsData.map(
                (item: CardStatsHorizontalProps, index: number) => {
                  return (
                    <Grid item xs={12} md={3} sm={6} key={index}>
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

      {/* Channel tabs. Data-driven from GET /inbox/channels, so a newly
          integrated platform appears here with no change to this page. */}
      <ChannelTabs />

      {activeTab !== LIVE_CHAT_TAB ? (
        <ChannelInbox channel={activeTab} />
      ) : (
      <div style={{display:'flex'}}>
      <Box   
          sx={{
          height: '65vh',
          display: 'flex',
          position: 'relative',
        }}>
        <SidebarLeft
          store={store}
          hidden={hidden}
          mdAbove={mdAbove}
          dispatch={dispatch}
          statusObj={statusObj}
          userStatus={userStatus}
          enableSound={enableSound}
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
          clearActiveMessage={clearActiveMessage}
          addActiveMessage={addActiveMessage}
          updateActiveConversation={updateActiveConversation}
          handleSoundToggle={handleToggleSound}
        />
      </Box> 
       <Box style={{boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'}}
        className="app-chat"
        sx={{
          width: '100%',
          height: '65vh',
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: 'background.paper',
          boxShadow: skin === 'bordered' ? 0 : 6,
          ...(skin === 'bordered' && {
            border: `1px solid ${theme.palette.divider}`,
          }),
        }}
      >
      <ChatContent
      socket={chatContext}
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
      setUpdateStats={setUpdateStats}
    /></Box>
      </div>
      )}
    </>
  );
};

AppChat.contentHeightFixed = false;

export default AppChat;
