// ** MUI Imports
import MuiTimeline, { TimelineProps } from '@mui/lab/Timeline';
import Grid from '@mui/material/Grid';
import { styled } from '@mui/material/styles';

// ** Types

// ** Demo Component Imports
import VisitorAgentTableList from 'src/views/visitors/view/visitorAgentTableList';
import VisitorBotTableList from 'src/views/visitors/view/VisitorBotTableList';
import VisitorServiceRequest from 'src/views/visitors/view/VisitorServiceRequest';
import VisitorFeedbackList from 'src/views/visitors/view/VisitorFeedbackList'
interface Props {
  //invoiceData: InvoiceType[];
}



interface Props {
  tab: string;
  //invoiceData: InvoiceType[];
  visitorId: any;
}

const UserViewOverview = ({ tab, visitorId }: Props) => {
  return (
    <Grid container spacing={6}>
    
      <Grid item xs={12}>
        <VisitorBotTableList tab={tab} visitorId={visitorId} />
      </Grid>
      <Grid item xs={12}>
        <VisitorAgentTableList tab={tab} visitorId={visitorId}/>
      </Grid>
      <Grid item xs={12}>
        <VisitorServiceRequest tab={tab} visitorId={visitorId} />
      </Grid>
      <Grid item xs={12}>
        <VisitorFeedbackList tab={tab} visitorId={visitorId} />
      </Grid>
    </Grid>
  );
};

export default UserViewOverview;
