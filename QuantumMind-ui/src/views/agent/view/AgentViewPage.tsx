// ** MUI Imports
import Grid from '@mui/material/Grid'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'

// ** Demo Components Imports
import AgentViewLeft from 'src/views/agent/view/AgentViewLeft'
import AgentViewRight from 'src/views/agent/view/AgentViewRight'

type Props = {
  agentId: any
  agentDetail: any
}

const AgentView = ({ agentId, agentDetail }: Props) => {
  
  const store = useSelector((state: RootState) => state.agent);

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} md={5} lg={4}>
        <AgentViewLeft agentId={agentId} agentDetail={store.selectedAgentData} />
      </Grid>
      <Grid item xs={12} md={7} lg={8}>
        <AgentViewRight agentId={agentId} agentDetail={store.selectedAgentData} />
      </Grid>
    </Grid>
  )
}

export default AgentView
