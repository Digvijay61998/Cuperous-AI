// ** React Imports
import { useEffect, useState } from 'react';

// ** MUI Imports
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { LoadingButton } from '@mui/lab';

import { OwnershipView, typingActive } from './ownership';

interface Props {
  view: OwnershipView;
  /** Bot toggle supported by this channel; without it there is nothing to take over. */
  canControl: boolean;
  busy?: boolean;
  onTakeover: () => void;
  onRelease: () => void;
  /** Resolves on success; rejects with a message to show in the dialog (R8.4). */
  onOverride: () => Promise<void>;
  typing?: { name: string; at: number } | null;
}

/**
 * Header controls for one chat (R8.1–R8.7): who is handling it, the buttons
 * the signed-in user may use, the admin Override with confirmation, and the
 * "<name> is replying…" indicator.
 */
const OwnershipControls = ({ view, canControl, busy, onTakeover, onRelease, onOverride, typing }: Props) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [overrideError, setOverrideError] = useState('');
  const [overriding, setOverriding] = useState(false);

  // Re-render once the indicator should expire (5 s after the last signal).
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!typing) return;
    const left = Math.max(0, typing.at + 5000 - Date.now());
    const t = setTimeout(() => setNow(Date.now()), left + 50);
    return () => clearTimeout(t);
  }, [typing]);
  const showTyping = !!typing && view.kind === 'other' && typingActive(typing.at, now);

  const confirm = async () => {
    setOverriding(true);
    setOverrideError('');
    try {
      await onOverride();
      setConfirmOpen(false);
    } catch (e: any) {
      setOverrideError(e?.message || 'The override did not complete.');
    } finally {
      setOverriding(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      {view.headerText && (
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }} role="status">
            {view.headerText}
          </Typography>
          {showTyping && (
            <Typography variant="caption" sx={{ color: 'text.secondary' }} aria-live="polite">
              {typing!.name} is replying…
            </Typography>
          )}
        </Box>
      )}

      {canControl && view.showTakeover && (
        <Tooltip
          title={view.kind === 'other' ? view.headerText || '' : 'Take this conversation over from the bot'}
          placement="top"
        >
          <span>
            <Button size="small" variant="outlined" disabled={busy || view.kind === 'other'} onClick={onTakeover}>
              Take over
            </Button>
          </span>
        </Tooltip>
      )}

      {canControl && view.showRelease && (
        <Tooltip title="Hand this conversation back to the bot" placement="top">
          <span>
            <Button size="small" variant="outlined" color="warning" disabled={busy} onClick={onRelease}>
              Release to bot
            </Button>
          </span>
        </Tooltip>
      )}

      {view.showOverride && (
        <Button
          size="small"
          variant="text"
          color="error"
          onClick={() => {
            setOverrideError('');
            setConfirmOpen(true);
          }}
        >
          Override
        </Button>
      )}

      <Dialog
        open={confirmOpen}
        onClose={overriding ? undefined : () => setConfirmOpen(false)}
        aria-labelledby="override-title"
        aria-describedby="override-desc"
      >
        <DialogTitle id="override-title">Take over this chat?</DialogTitle>
        <DialogContent>
          <DialogContentText id="override-desc">
            {view.ownerName} is handling this chat. If you continue, you become the owner and {view.ownerName} can no
            longer reply. They will be told that you took it over.
          </DialogContentText>
          {overrideError && (
            <Alert severity="error" sx={{ mt: 3 }} role="alert">
              {overrideError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={overriding}>
            Cancel
          </Button>
          <LoadingButton color="error" variant="contained" loading={overriding} onClick={confirm}>
            Override
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OwnershipControls;
