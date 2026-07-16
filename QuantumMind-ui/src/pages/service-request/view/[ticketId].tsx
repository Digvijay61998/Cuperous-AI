// ** MUI Imports
import { ChangeEvent, MouseEvent, useState, useEffect, SyntheticEvent } from 'react'
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineItem from '@mui/lab/TimelineItem';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import AvatarGroup from '@mui/material/AvatarGroup';
import CardContent from '@mui/material/CardContent';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import MuiTimeline, { TimelineProps } from '@mui/lab/Timeline';
import { RootState, AppDispatch } from 'src/store';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux'
import { getTicketDataById } from 'src/store/apps/service-request';
// ** Demo Component Imports
// import UsersProjectListTable from 'src/views/agent/view/UsersProjectListTable';

import TicketViewById from 'src/views/service-request/list/view/';
import ChatLogs from 'src/views/service-request/list/view/ChatLogs';


// Styled Timeline component
const Timeline = styled(MuiTimeline)<TimelineProps>(({ theme }) => ({
  margin: 0,
  padding: 0,
  marginLeft: theme.spacing(0.75),
  '& .MuiTimelineItem-root': {
    '&:before': {
      display: 'none',
    },
    '&:last-child': {
      minHeight: 60,
    },
  },
}));



const UserViewOverview = (agentDetail:any) => {

  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const botDetails = useSelector((state: any) => state.flow.botDetails);
  const ticketDetails = useSelector((state: any) => state.serviceRequest.ticketList);
 
  const ticketId = router.query.ticketId;
//Ui refresh karun line no 

    useEffect(() => {
      if (ticketId) {
        dispatch(getTicketDataById(ticketId))
        // dispatch(getBotFLow(botId))
        // dispatch(getBotFLow(botId))
      }
    }, [ticketId]);
    useEffect(() => {
      if(ticketDetails){
        // setNodes(botDetails.nodes);
        // setEdges(botDetails.edges)
      }
    }, [ticketDetails]) 
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <TicketViewById/>

      </Grid>
      

    </Grid>
  );
};

export default UserViewOverview;
