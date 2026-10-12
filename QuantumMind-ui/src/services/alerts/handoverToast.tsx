import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { toast } from 'react-hot-toast';
import { REASON_LABEL, type HandoverAlert } from './types';

const toastId = (alertId: string) => `handover-${alertId}`;

/** Normal alerts auto-dismiss after 10s; emergencies stay until acknowledged. */
export const NORMAL_TOAST_MS = 10000;

export function showHandoverToast(alert: HandoverAlert, onOpen: (id: string) => void) {
  const high = alert.priority === 'high';
  toast.custom(
    (t) => (
      <Box
        role="alert"
        aria-live={high ? 'assertive' : 'polite'}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 3,
          minWidth: 300,
          maxWidth: 420,
          borderRadius: 1,
          boxShadow: 6,
          bgcolor: high ? 'error.main' : 'background.paper',
          color: high ? 'common.white' : 'text.primary',
          borderLeft: (theme) => `6px solid ${high ? theme.palette.error.dark : theme.palette.primary.main}`,
          opacity: t.visible ? 1 : 0,
          transition: 'opacity 200ms',
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ color: 'inherit', fontWeight: 700 }}>
            {high ? '🚨 Emergency handover' : 'Visitor needs an agent'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'inherit' }} noWrap>
            {alert.visitorName || 'Anonymous visitor'} {REASON_LABEL[alert.reason] ?? alert.reason}
          </Typography>
        </Box>
        <Button
          size="small"
          variant={high ? 'outlined' : 'contained'}
          color={high ? 'inherit' : 'primary'}
          onClick={() => {
            onOpen(alert.id);
            toast.dismiss(t.id);
          }}
        >
          Open
        </Button>
      </Box>
    ),
    {
      id: toastId(alert.id),
      duration: high ? Infinity : NORMAL_TOAST_MS,
      position: 'top-right',
    },
  );
}

export function dismissHandoverToast(alertId: string) {
  toast.dismiss(toastId(alertId));
}
