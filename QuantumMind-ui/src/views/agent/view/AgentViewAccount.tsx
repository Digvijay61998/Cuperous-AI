// ** MUI Imports
import MuiTimeline, { TimelineProps } from '@mui/lab/Timeline';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';

// ** Demo Component Imports
import AgentBotListTable from 'src/views/agent/view/AgentBotListTable';
import AgentConversationList from 'src/views/agent/view/AgentConversationList';
import ServiceRequestTable from './AgentsServiceRequests';


const AgentViewOverview = (props:any) => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <AgentBotListTable agentDetail={props?.agentDetail}/>
      </Grid>
      <Grid item xs={12}>
        <AgentConversationList conversations={props?.agentDetail?.conversations}/>
      </Grid>
      <Grid item xs={12}>
        <ServiceRequestTable seriveRequests={props?.agentDetail?.serviceRequests}/>
      </Grid>
     

    </Grid>
  );
};

export default AgentViewOverview;
