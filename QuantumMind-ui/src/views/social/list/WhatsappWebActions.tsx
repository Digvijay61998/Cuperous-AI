// ** OpenWA-style session action buttons for a WhatsApp Web row in the Social
// Messengers list. Renders View(edit)/Start/Show QR/Stop/Unlink/Kill Stuck/
// Delete driven by the row's session status, and hosts the Scan QR dialog.
import { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { toast } from 'react-hot-toast';
import Icon from 'src/@core/components/icon';
import {
  deleteWhatsappWebSession,
  killWhatsappWebSession,
  startWhatsappWebSession,
  stopWhatsappWebSession,
  unlinkWhatsappWebSession,
} from 'src/store/apps/whatsapp-web';
import WhatsappWebQrModal from './WhatsappWebQrModal';

interface Props {
  row: any;
  onChanged: () => void;
  onEdit: () => void;
}

const ACTIVE_STATUSES = ['initializing', 'qr_ready', 'authenticating', 'ready'];

const WhatsappWebActions = (props: Props) => {
  const { row, onChanged, onEdit } = props;
  const sessionId: string = row?.sessionId;
  const status: string = row?.sessionStatus || 'created';
  const isReady = status === 'ready';
  const isActive = ACTIVE_STATUSES.includes(status);

  const [busy, setBusy] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const run = async (fn: () => Promise<any>, successMsg?: string) => {
    if (busy || !sessionId) return;
    try {
      setBusy(true);
      await fn();
      if (successMsg) toast.success(successMsg);
      onChanged();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const handleStart = async () => {
    if (!sessionId) return;
    try {
      setBusy(true);
      await startWhatsappWebSession(sessionId);
      setQrOpen(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to start');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete WhatsApp Web session "${row?.name}"? This unlinks the number and removes the messenger.`)) {
      return;
    }
    await run(() => deleteWhatsappWebSession(sessionId), 'Session deleted');
  };

  return (
    <>
      <Tooltip placement="top" title="Edit" arrow>
        <IconButton size="small" sx={{ mr: 1 }} color="primary" onClick={onEdit}>
          <Icon icon="bxs:edit" fontSize={20} />
        </IconButton>
      </Tooltip>

      {!isReady && (
        <Tooltip placement="top" title={isActive ? 'Show QR' : 'Start'} arrow>
          <IconButton
            size="small"
            sx={{ mr: 1 }}
            color="success"
            disabled={busy}
            onClick={() => (isActive ? setQrOpen(true) : handleStart())}
          >
            <Icon icon={isActive ? 'bx:qr-scan' : 'bx:play'} fontSize={20} />
          </IconButton>
        </Tooltip>
      )}

      {isActive && (
        <Tooltip placement="top" title="Stop" arrow>
          <IconButton
            size="small"
            sx={{ mr: 1 }}
            color="warning"
            disabled={busy}
            onClick={() => run(() => stopWhatsappWebSession(sessionId), 'Session stopped')}
          >
            <Icon icon="bx:stop" fontSize={20} />
          </IconButton>
        </Tooltip>
      )}

      {isReady && (
        <Tooltip placement="top" title="Unlink" arrow>
          <IconButton
            size="small"
            sx={{ mr: 1 }}
            color="error"
            disabled={busy}
            onClick={() => run(() => unlinkWhatsappWebSession(sessionId), 'Device unlinked')}
          >
            <Icon icon="bx:unlink" fontSize={20} />
          </IconButton>
        </Tooltip>
      )}

      {isActive && (
        <Tooltip placement="top" title="Kill Stuck" arrow>
          <IconButton
            size="small"
            sx={{ mr: 1 }}
            color="error"
            disabled={busy}
            onClick={() => run(() => killWhatsappWebSession(sessionId), 'Session killed')}
          >
            <Icon icon="mdi:skull-outline" fontSize={20} />
          </IconButton>
        </Tooltip>
      )}

      <Tooltip placement="top" title="Delete" arrow>
        <IconButton size="small" color="error" disabled={busy} onClick={handleDelete}>
          <Icon icon="bx:trash" fontSize={20} />
        </IconButton>
      </Tooltip>

      <WhatsappWebQrModal
        open={qrOpen}
        sessionId={sessionId}
        sessionName={row?.name}
        onClose={() => setQrOpen(false)}
        onConnected={onChanged}
      />
    </>
  );
};

export default WhatsappWebActions;
