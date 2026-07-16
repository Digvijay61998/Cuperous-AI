import { useState } from 'react';
// ** MUI Imports
import Grid from '@mui/material/Grid';

// ** Demo Component Imports
import AnalyticsCongratulations from 'src/views/dashboards/analytics/AnalyticsCongratulations';
import AnalyticsSales from 'src/views/dashboards/analytics/AnalyticsSales';
import AnalyticsTotalRevenue from 'src/views/dashboards/analytics/AnalyticsTotalRevenue';

// ** Styled Component Import
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts';
import { AppDispatch, RootState } from 'src/store';
import {
  getBlockedConversationByCurrent,
  getPendingRequestByCurrent,
  getTotalConversationByCurrent,
  getTotalRequestByCurrent,
  getTotalVisitorsByCurrent,
  getUnansweredQuestionsByCurrent
} from 'src/store/apps/dashboard';
import Card from '@mui/material/Card';
const AnalyticsDashboard = () => {
  const optionMenu = [
    {
      text: 'This Year',
      value: 'year',
    },
    {
      text: 'This Month',
      value: 'month',
    },
    {
      text: 'This Week',
      value: 'week',
    },
    {
      text: 'Today',
      value: 'day',
    },
    {
      text: 'Last Hour',
      value: 'hour',
    },
  ];
  const {
    totalConversationByCurrent,
    totalRequestsByCurrent,
    totalVisitorsByCurrent,
    blockedConversationByCurrent,
    pendingRequestsByCurrent,
    unansweredQuestionsByCurrent,
  } = useSelector((state: RootState) => state.dashboard);
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    if (dispatch) {
      dispatch(getTotalConversationByCurrent({ time: 'year' }));
      dispatch(getTotalVisitorsByCurrent({ time: 'year' }));
      dispatch(getTotalRequestByCurrent({ time: 'year' }));
      dispatch(getPendingRequestByCurrent({ time: 'year' }));
      dispatch(getBlockedConversationByCurrent({ time: 'year' }));
      dispatch(getUnansweredQuestionsByCurrent({ time: 'year' }));
    }
  }, []);
  const [update, setUpdate] = useState<string>('');
  const [updatedData, setUpdatedData] = useState<any>({
    totalConversationByCurrent: {},
    totalRequestsByCurrent: {},
    totalVisitorsByCurrent: {},
    blockedConversationByCurrent: {},
    pendingRequestsByCurrent: {},
    unansweredQuestionsByCurrent: {},
  });

  useEffect(() => {
    if (update === 'total_conversation') {
      setUpdatedData({
        ...updatedData,
        totalConversationByCurrent: totalConversationByCurrent,
      });
    }
    if (update === 'total_visitors') {
      setUpdatedData({
        ...updatedData,
        totalVisitorsByCurrent: totalVisitorsByCurrent,
      });
    }
    if (update === 'total_requests') {
      setUpdatedData({
        ...updatedData,
        totalRequestsByCurrent: totalRequestsByCurrent,
      });
    }
    if (update === 'pending_requests') {
      setUpdatedData({
        ...updatedData,
        pendingRequestsByCurrent: pendingRequestsByCurrent,
      });
    }
    if (update === 'blocked_conversation') {
      setUpdatedData({
        ...updatedData,
        blockedConversationByCurrent: blockedConversationByCurrent,
      });
    }
    if (update === 'unanswered_questions') {
      setUpdatedData({
        ...updatedData,
        unansweredQuestionsByCurrent: unansweredQuestionsByCurrent,
      });
    }
  }, [
    totalConversationByCurrent,
    pendingRequestsByCurrent,
    blockedConversationByCurrent,
    unansweredQuestionsByCurrent,
    totalVisitorsByCurrent,
    totalRequestsByCurrent,
  ]);
  const handleTotalConversation = async (time: string) => {
    await dispatch(getTotalConversationByCurrent({ time }));
    setUpdate('total_conversation');
  };
  const handleTotalVisitors = async (time: string) => {
    await dispatch(getTotalVisitorsByCurrent({ time }));
    setUpdate('total_visitors');
  };
  const handleTotalRequests = async (time: string) => {
    await dispatch(getTotalRequestByCurrent({ time }));
    setUpdate('total_requests');
  };
  const handlePendingRequests = async (time: string) => {
    await dispatch(getPendingRequestByCurrent({ time }));
    setUpdate('pending_requests');
  };
  const handleBlockedConversation = async (time: string) => {
    await dispatch(getBlockedConversationByCurrent({ time }));
    setUpdate('blocked_conversation');
  };
  const handleUnansweredQuestions = async (time: string) => {
    await dispatch(getUnansweredQuestionsByCurrent({ time }));
    setUpdate('unanswered_questions');
  };
  return (
    <ApexChartWrapper>
      <Grid container spacing={6} 
        className='match-height'
      >
          
              <Grid item xs={12}  lg={8} >
              <AnalyticsCongratulations />
                </Grid>

              <Grid  item xs={12} md={4}>
              <div >
              <Grid container spacing={6}>
                <Grid item xs={6} md={12} lg={6} >
                <Card sx={{boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'}} >
                  <AnalyticsSales
                    title="Total Conversation"
                    stats={
                      updatedData?.totalConversationByCurrent?.stats ||
                      totalConversationByCurrent?.stats
                    }
                    trendNumber={
                      updatedData?.totalConversationByCurrent?.trendNumber ||
                      totalConversationByCurrent?.trendNumber ||
                      0
                    }
                    optionsMenuProps={{
                      options: optionMenu,
                    }}
                    avatarIcon="/images/new/dashbpard/TOTAL-CONVERSTIONS.png"
                    avatarColor="success"
                    handleChange={handleTotalConversation}
                  /></Card>
                </Grid>
                <Grid item xs={6} md={12} lg={6}>
                  <Card sx={{boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'}} >
                  <AnalyticsSales
                    title="Total Visitors"
                    stats={
                      updatedData?.totalVisitorsByCurrent?.stats ||
                      totalVisitorsByCurrent?.stats
                    }
                    optionsMenuProps={{
                      options: optionMenu,
                    }}
                    trendNumber={
                      updatedData?.totalVisitorsByCurrent?.trendNumber ||
                      totalVisitorsByCurrent?.trendNumber ||
                      0
                    }
                    avatarIcon="/images/new/dashbpard/TOTAL_VISITORS.png"
                    handleChange={handleTotalVisitors}
                  />
                  </Card>
                </Grid>
              </Grid>
              </div>
            </Grid>
            
         <Grid container spacing={6} md={8} lg={12} 
         sx={{flexDirection:'row', 
              flexWrap:"wrap" ,
              marginLeft:"0",
              marginTop:"-0.5rem", 
              marginBottom:"1rem"}}
         >
            <Grid  item xs={6} md={6} lg={3}  >
            <Card sx={{boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'}} >
              <AnalyticsSales
                title="Total Requests"
                stats={
                  updatedData?.totalRequestsByCurrent?.stats ||
                  totalRequestsByCurrent?.stats
                }
                trendNumber={
                  updatedData?.totalRequestsByCurrent?.trendNumber ||
                  totalRequestsByCurrent?.trendNumber ||
                  0
                }
                avatarIcon="/images/new/dashbpard/TOTAL_REQUESTS.png"
                avatarColor="warning"
                optionsMenuProps={{
                  options: optionMenu,
                }}
                handleChange={handleTotalRequests}
              />
           </Card>
            </Grid>
            <Grid  item xs={6} md={6} lg={3}>
            <Card sx={{boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'}} >
              <AnalyticsSales
                title="Pending Request"
                stats={
                  updatedData?.pendingRequestsByCurrent?.stats ||
                  pendingRequestsByCurrent?.stats
                }
                trendNumber={
                  updatedData?.pendingRequestsByCurrent?.trendNumber ||
                  pendingRequestsByCurrent?.trendNumber ||
                  0
                }
                avatarIcon="/images/new/dashbpard/PENDING_REQUESTIS.png"
                avatarColor="error"
                optionsMenuProps={{
                  options: optionMenu,
                }}
                handleChange={handlePendingRequests}
              /></Card>
            </Grid>
            <Grid item xs={6} md={6} lg={3}>
            <Card sx={{boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'}} >
              <AnalyticsSales
                title="Blocked Conversations"
                stats={
                  updatedData?.blockedConversationByCurrent?.stats ||
                  blockedConversationByCurrent?.stats
                }
                trendNumber={
                  updatedData?.blockedConversationByCurrent?.trendNumber ||
                  blockedConversationByCurrent?.trendNumber ||
                  0
                }
                avatarIcon="/images/new/dashbpard/BLOCKED-CONVERSTIONS.png"
                avatarColor="error"
                optionsMenuProps={{
                  options: optionMenu,
                }}
                handleChange={handleBlockedConversation}
              /></Card>
            </Grid>
            <Grid item xs={6} md={6} lg={3}> 
            <Card sx={{boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'}} >
              <AnalyticsSales
                title="Unanswered Questions"
                stats={
                  updatedData?.unansweredQuestionsByCurrent?.stats ||
                  unansweredQuestionsByCurrent?.stats
                }
                trendNumber={
                  updatedData?.unansweredQuestionsByCurrent?.trendNumber ||
                  unansweredQuestionsByCurrent?.trendNumber ||
                  0
                }
                avatarIcon="/images/new/dashbpard/UNANSWERED_QUESTIONS.png"
                avatarColor="warning"
                optionsMenuProps={{
                  options: optionMenu,
                }}
                handleChange={handleUnansweredQuestions}
              />
              </Card>
            </Grid> 
          </Grid>
      
      </Grid>

      <Grid item xs={12} lg={8}>
          <AnalyticsTotalRevenue />
        </Grid>
    </ApexChartWrapper>
  );
};

export default AnalyticsDashboard;
