import { useRouter } from 'next/router';

// ** Demo Components Imports
import AgentViewPage from "src/views/agent/view/AgentViewPage";

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux';

// ** Actions Imports
import { useEffect, useState } from 'react';
import { fetchAgentDetail } from 'src/store/apps/agent';

// ** Types Imports
import { AppDispatch, RootState } from 'src/store';

const UserView = () => {
  const router = useRouter(); 
  const agentId = router.query.agentId;
  
  const agentDetails = useSelector((state: RootState) => state.agent.selectedAgentData);
  const dispatch = useDispatch<AppDispatch>();

  const [agentDetail, setAgentDetail] = useState<any>({});

  useEffect(() => {
    if(agentId) {
      dispatch(
        fetchAgentDetail(agentId)
      );
    }
    
  }, [agentId]);
  useEffect(() => {
    if(agentDetails) {
      setAgentDetail(agentDetails);
    } else {
      setAgentDetail({});
    }
    
  }, [agentDetails]);

  return <AgentViewPage agentId={agentId} agentDetail={agentDetail} />;
};

export default UserView;
