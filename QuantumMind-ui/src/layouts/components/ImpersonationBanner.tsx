import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { endImpersonation, impersonatedOrg } from 'src/services/console.service';

/**
 * Visible for the whole impersonation session so the super admin always knows
 * they are acting inside a customer's organization, with a one-click exit.
 */
const ImpersonationBanner = () => {
  const [org, setOrg] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    setOrg(impersonatedOrg());
  }, []);

  if (!org) return null;

  return (
    <Alert
      severity="warning"
      role="status"
      sx={{ mb: 4 }}
      action={
        <Button color="inherit" size="small" onClick={endImpersonation}>
          Exit
        </Button>
      }
    >
      You are managing <strong>{org.name}</strong> as its admin. Actions are
      audit-logged.
    </Alert>
  );
};

export default ImpersonationBanner;
