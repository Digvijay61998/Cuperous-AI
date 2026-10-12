import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { useSelector } from 'react-redux';
import { RootState } from 'src/store';
import Icon from 'src/@core/components/icon';
import { canManagePlugins } from './crmPlugins';

/** Shown on a page whose CRM plugin is turned off (crm-plugins-service-desk R8.2). */
const PluginOffState = ({ label, icon = 'bx:extension' }: { label: string; icon?: string }) => {
  const role = useSelector((state: RootState) => (state.user as any)?.userData?.role);
  return (
    <Card sx={{ p: 10, textAlign: 'center' }} role="status">
      <Icon icon={icon} fontSize={48} aria-hidden />
      <Typography variant="h6" sx={{ mt: 3 }}>
        The {label} module is turned off
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 5 }}>
        Its data is kept. {canManagePlugins(role) ? 'Turn it on again to see it.' : 'Ask an admin to turn it on.'}
      </Typography>
      {canManagePlugins(role) && (
        <Box>
          <Link href="/crm/plugins" passHref>
            <Button component="a" variant="contained" startIcon={<Icon icon="bx:extension" />}>
              Go to Plugins
            </Button>
          </Link>
        </Box>
      )}
    </Card>
  );
};

export default PluginOffState;
