// ** Old Service Requests list: requests live on the CRM board now (crm-plugins-service-desk R17.5).
import { useEffect } from 'react';
import { useRouter } from 'next/router';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

const ServiceRequestListRedirect = () => {
  const router = useRouter();
  useEffect(() => {
    void router.replace('/crm/service-requests');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
      <CircularProgress aria-label="Opening Service Requests" />
    </Box>
  );
};

export default ServiceRequestListRedirect;
