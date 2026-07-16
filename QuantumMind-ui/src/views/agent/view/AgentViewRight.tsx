
import AgentViewAccount from 'src/views/agent/view/AgentViewAccount';

// ** Types

interface Props {
  agentId: string;
  agentDetail: any;
}


const AgentViewRight = ({ agentDetail }: Props) => {
 
  return <AgentViewAccount agentDetail={agentDetail} />;
};

export default AgentViewRight;
