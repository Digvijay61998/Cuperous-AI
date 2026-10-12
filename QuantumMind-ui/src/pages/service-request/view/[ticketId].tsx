// ** Old request page: opens the request's drawer on the CRM board (crm-plugins-service-desk R17.5).
import { useEffect } from 'react';
import { useRouter } from 'next/router';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

const ServiceRequestViewRedirect = () => {
  const router = useRouter();
  useEffect(() => {
    if (!router.isReady) return;
    const id = router.query.ticketId;
    const v = Array.isArray(id) ? id[0] : id;
    void router.replace(v ? `/crm/service-requests/${encodeURIComponent(v)}` : '/crm/service-requests');
  }, [router, router.isReady]);
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
      <CircularProgress aria-label="Opening the request" />
    </Box>
  );
};

export default ServiceRequestViewRedirect;
