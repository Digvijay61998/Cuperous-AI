// ** React Imports
import { useState } from 'react';

// ** MUI Imports
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// ** Store
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import { previewCrmPluginToggle, reorderCrmPlugins, setCrmPluginEnabled } from 'src/store/apps/crm-plugins';

// ** Components
import Icon from 'src/@core/components/icon';
import CustomAvatar from 'src/@core/components/mui/avatar';
import CustomChip from 'src/@core/components/mui/chip';

// ** Plugins
import { canManagePlugins, confirmText, CrmPlugin, moveKey } from 'src/views/crm/plugins/crmPlugins';
import useCrmPlugins from 'src/views/crm/plugins/useCrmPlugins';

interface Pending {
  plugin: CrmPlugin;
  enabled: boolean;
  text: string;
}

/**
 * CRM → Plugins (crm-plugins-service-desk R7). Org admins and managers turn
 * modules on and off and set the menu order. Contacts and Service Requests
 * are part of the CRM and always on. Turning a module off keeps its data.
 */
const CrmPlugins = () => {
  const dispatch = useDispatch<AppDispatch>();
  const role = useSelector((state: RootState) => (state.user as any)?.userData?.role);
  const { plugins, loading, saving } = useCrmPlugins();
  const [pending, setPending] = useState<Pending | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  if (!canManagePlugins(role)) {
    return (
      <Card sx={{ p: 10, textAlign: 'center' }} role="status">
        <Typography variant="h6">Only admins and managers can change CRM plugins.</Typography>
      </Card>
    );
  }
  if (!plugins) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        {loading ? <CircularProgress aria-label="Loading plugins" /> : <Typography>Could not load the plugins.</Typography>}
      </Box>
    );
  }

  const sorted = [...plugins].sort((a, b) => a.position - b.position);

  const toggle = async (plugin: CrmPlugin, enabled: boolean) => {
    setBusyKey(plugin.key);
    try {
      const preview = await previewCrmPluginToggle(plugin.key, enabled);
      const text = confirmText(preview.changes, plugin.key);
      if (text) {
        setPending({ plugin, enabled, text });
        return;
      }
      await dispatch(setCrmPluginEnabled({ key: plugin.key, enabled }));
    } catch {
      // toast shown by the thunk; a failed preview falls back to the backend's answer
      await dispatch(setCrmPluginEnabled({ key: plugin.key, enabled }));
    } finally {
      setBusyKey(null);
    }
  };

  const confirm = async () => {
    if (!pending) return;
    const p = pending;
    setPending(null);
    setBusyKey(p.plugin.key);
    await dispatch(setCrmPluginEnabled({ key: p.plugin.key, enabled: p.enabled }));
    setBusyKey(null);
  };

  const move = (key: string, delta: -1 | 1) => dispatch(reorderCrmPlugins(moveKey(sorted, key, delta)));

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant="h5" component="h1" sx={{ mb: 1 }}>
          CRM plugins
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Choose which modules your team sees in the CRM, and in which order. Turning a module off hides it and keeps
          its data.
        </Typography>
      </Grid>

      {sorted.map((plugin, index) => (
        <Grid item xs={12} md={6} key={plugin.key}>
          <Card sx={{ height: '100%', opacity: plugin.enabled ? 1 : 0.75 }}>
            <CardContent sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
              <CustomAvatar skin="light" variant="rounded" color={plugin.enabled ? 'primary' : 'secondary'} sx={{ width: 48, height: 48 }}>
                <Icon icon={plugin.icon} fontSize={24} aria-hidden />
              </CustomAvatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Typography component="h2" sx={{ fontWeight: 600 }} id={`plugin-${plugin.key}`}>
                    {plugin.label}
                  </Typography>
                  {plugin.core && <CustomChip rounded skin="light" size="small" color="info" label="Always on" />}
                  {!plugin.showInMenu && (
                    <CustomChip rounded skin="light" size="small" color="secondary" label="Coming soon" />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {plugin.description}
                </Typography>
                {plugin.dependsOn.length > 0 && (
                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
                    Needs {plugin.dependsOn.map((k) => plugins.find((p) => p.key === k)?.label ?? k).join(', ')}.
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Tooltip title={plugin.core ? 'Part of the CRM, cannot be turned off' : plugin.enabled ? 'Turn off' : 'Turn on'}>
                  <span>
                    <Switch
                      checked={plugin.enabled}
                      disabled={plugin.core || saving || busyKey === plugin.key}
                      onChange={(e) => toggle(plugin, e.target.checked)}
                      inputProps={{ 'aria-labelledby': `plugin-${plugin.key}` }}
                    />
                  </span>
                </Tooltip>
                <Box>
                  <IconButton
                    size="small"
                    aria-label={`Move ${plugin.label} up`}
                    disabled={index === 0 || saving}
                    onClick={() => move(plugin.key, -1)}
                  >
                    <Icon icon="bx:chevron-up" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={`Move ${plugin.label} down`}
                    disabled={index === sorted.length - 1 || saving}
                    onClick={() => move(plugin.key, 1)}
                  >
                    <Icon icon="bx:chevron-down" />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}

      <Dialog open={!!pending} onClose={() => setPending(null)} aria-labelledby="plugin-confirm-title">
        <DialogTitle id="plugin-confirm-title">
          Turn {pending?.enabled ? 'on' : 'off'} {pending?.plugin.label}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{pending?.text}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPending(null)}>Cancel</Button>
          <Button variant="contained" onClick={confirm} color={pending?.enabled ? 'primary' : 'error'}>
            Turn {pending?.enabled ? 'on' : 'off'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default CrmPlugins;
