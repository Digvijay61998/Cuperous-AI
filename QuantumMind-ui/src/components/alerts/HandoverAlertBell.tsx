import { useState, MouseEvent } from 'react';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Popover from '@mui/material/Popover';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'src/@core/components/icon';
import { AppDispatch, RootState } from 'src/store';
import { fetchOpenAlerts, saveSoundPrefs } from 'src/store/apps/alerts';
import { sortAlerts } from 'src/services/alerts/alertPolicy';
import { currentAlertClient } from 'src/services/alerts/alertClient';
import { openHandoverAlert } from 'src/services/alerts/openAlert';
import { REASON_LABEL, type SoundPrefs } from 'src/services/alerts/types';

function timeAgo(iso: string): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

/** App-bar indicator: open handover requests, sound settings, autoplay prompt. */
const HandoverAlertBell = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { byId, prefs, soundBlocked, loadError } = useSelector(
    (state: RootState) => state.alerts,
  );
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const alerts = sortAlerts(Object.values(byId));
  const hasHigh = alerts.some((a) => a.priority === 'high');

  const updatePrefs = (patch: Partial<SoundPrefs>) => {
    const next = { ...prefs, ...patch };
    dispatch(saveSoundPrefs({ next, previous: prefs })).then((r: any) => {
      if (saveSoundPrefs.fulfilled.match(r)) currentAlertClient()?.broadcastPrefs(r.payload);
    });
  };

  return (
    <>
      <Tooltip
        title={
          soundBlocked
            ? 'Sound is blocked by the browser — click anywhere to enable'
            : alerts.length
            ? `${alerts.length} visitor(s) waiting for an agent`
            : 'Handover alerts'
        }
      >
        <IconButton
          color="inherit"
          aria-label={`Handover alerts, ${alerts.length} open`}
          aria-haspopup="true"
          onClick={(e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)}
        >
          <Badge
            badgeContent={alerts.length}
            color={hasHigh ? 'error' : 'primary'}
            max={99}
            overlap="circular"
          >
            <Icon
              icon={
                soundBlocked || !prefs.handoverSound
                  ? 'bx:bell-off'
                  : alerts.length
                  ? 'bxs:bell-ring'
                  : 'bx:bell'
              }
            />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 360, maxWidth: '95vw' } }}
      >
        <Box sx={{ px: 4, pt: 3, pb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Handover requests
          </Typography>
        </Box>

        {soundBlocked && (
          <Alert severity="warning" sx={{ mx: 3, mb: 2 }}>
            Your browser blocked the alert sound. Click anywhere on the page to enable it.
          </Alert>
        )}
        {loadError && (
          <Alert
            severity="error"
            sx={{ mx: 3, mb: 2 }}
            action={
              <Typography
                component="button"
                variant="caption"
                onClick={() => dispatch(fetchOpenAlerts())}
                sx={{ border: 0, bgcolor: 'transparent', cursor: 'pointer', color: 'inherit', textDecoration: 'underline' }}
              >
                Retry
              </Typography>
            }
          >
            Alerts could not be loaded.
          </Alert>
        )}

        {alerts.length === 0 ? (
          <Typography variant="body2" sx={{ px: 4, pb: 3, color: 'text.secondary' }}>
            No visitors are waiting for an agent.
          </Typography>
        ) : (
          <List dense sx={{ maxHeight: 320, overflowY: 'auto', py: 0 }}>
            {alerts.map((a) => (
              <ListItemButton
                key={a.id}
                onClick={() => {
                  setAnchor(null);
                  openHandoverAlert(a.id);
                }}
                sx={{
                  borderLeft: (theme) =>
                    `4px solid ${a.priority === 'high' ? theme.palette.error.main : theme.palette.primary.main}`,
                }}
              >
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {a.priority === 'high' && '🚨 '}
                      {a.visitorName || 'Anonymous visitor'}
                    </Typography>
                  }
                  secondary={`${REASON_LABEL[a.reason] ?? a.reason} · ${timeAgo(a.createdAt)}${
                    a.agentAssigned ? '' : ' · no agent assigned'
                  }`}
                />
              </ListItemButton>
            ))}
          </List>
        )}

        <Divider />
        <Box sx={{ px: 4, py: 2, display: 'flex', flexDirection: 'column' }}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={prefs.handoverSound}
                onChange={(e) => updatePrefs({ handoverSound: e.target.checked })}
              />
            }
            label={<Typography variant="body2">Handover alert sound</Typography>}
          />
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={prefs.messageSound}
                onChange={(e) => updatePrefs({ messageSound: e.target.checked })}
              />
            }
            label={<Typography variant="body2">Sound for messages in my chats</Typography>}
          />
        </Box>
      </Popover>
    </>
  );
};

export default HandoverAlertBell;
