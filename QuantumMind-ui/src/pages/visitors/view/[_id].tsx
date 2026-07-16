// ** Next Import
  
  // ** Third Party Imports
  
  // ** Types
  
  // ** Demo Components Imports
  import VisitorViewPage from "src/views/visitors/view/VisitorViewPage";
  
  import { useRouter } from 'next/router';

// ** Demo Components Imports

// ** Store Imports
import { useDispatch } from 'react-redux';

// ** Actions Imports
import { useEffect } from 'react';
import { fetchVisitorDetail } from 'src/store/apps/visitor';

// ** Types Imports
import { AppDispatch } from 'src/store';

const index = ({
  _Id,
}: any) => {
  const router = useRouter();
  const visitorId = router?.query?._id || router?.query?.id;
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    dispatch(
      fetchVisitorDetail(visitorId),
    );
  }, [visitorId]);
    
    return <VisitorViewPage tab={"account"} visitorId={visitorId}/>;
  };
  
  
  
  export default index;
  