// ** Scan QR Code dialog for WhatsApp Web sessions.
// Ports OpenWA's pairing modal: two tabs (QR Code / Link with Phone Number),
// auto-refreshing the QR every 5s and closing once the session reaches `ready`.
import { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { toast } from 'react-hot-toast';
import Icon from 'src/@core/components/icon';
import {
  getWhatsappWebQr,
  getWhatsappWebSession,
  requestWhatsappWebPairingCode,
} from 'src/store/apps/whatsapp-web';

interface Props {
  open: boolean;
  sessionId: string;
  sessionName?: string;
  onClose: () => void;
  onConnected?: () => void;
}

const POLL_MS = 5000;

const WhatsappWebQrModal = (props: Props) => {
  const { open, sessionId, sessionName, onClose, onConnected } = props;

  const [tab, setTab] = useState<'qr' | 'phone'>('qr');
  const [qr, setQr] = useState<string>('');
  const [status, setStatus] = useState<string>('initializing');
  const [phone, setPhone] = useState<string>('');
  const [pairingCode, setPairingCode] = useState<string>('');
  const [requesting, setRequesting] = useState<boolean>(false);
  const timer = useRef<any>(null);

  const poll = useCallback(async () => {
    if (!sessionId) return;
    try {
      const session = await getWhatsappWebSession(sessionId);
      const live = session.liveStatus || session.status;
      setStatus(live);
      if (live === 'ready') {
        setQr('');
        toast.success('WhatsApp connected');
        onConnected?.();
        onClose();
        return;
      }
      if (live === 'qr_ready') {
        try {
          const res = await getWhatsappWebQr(sessionId);
          if (res?.qrCode) setQr(res.qrCode);
        } catch {
          // QR briefly unavailable between refreshes — keep the current image.
        }
      }
    } catch {
      // transient; keep polling
    }
  }, [sessionId, onClose, onConnected]);

  useEffect(() => {
    if (!open) return;
    // Reset per-open so a reused dialog never shows a stale code.
    setTab('qr');
    setQr('');
    setPairingCode('');
    setPhone('');
    setStatus('initializing');
    poll();
    timer.current = setInterval(poll, POLL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [open, poll]);

  const handlePairing = async () => {
    if (requesting) return;
    if (!/^[0-9]{6,15}$/.test(phone)) {
      toast.error('Enter phone in international format, digits only');
      return;
    }
    try {
      setRequesting(true);
      const res = await requestWhatsappWebPairingCode(sessionId, phone);
      setPairingCode(res.pairingCode);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Failed to get pairing code',
      );
    } finally {
      setRequesting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6">Scan QR Code</Typography>
          {sessionName && (
            <Typography variant="body2" color="text.secondary">
              {sessionName}
            </Typography>
          )}
        </Box>
        <IconButton size="small" onClick={onClose}>
          <Icon icon="bx:x" fontSize={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Tabs
          value={tab}
          onChange={(_e, v) => setTab(v)}
          variant="fullWidth"
          sx={{ mb: 4 }}
        >
          <Tab value="qr" label="QR Code" />
          <Tab value="phone" label="Link with Phone Number" />
        </Tabs>

        {tab === 'qr' ? (
          <Box sx={{ textAlign: 'center' }}>
            {qr ? (
              <>
                <img
                  src={qr}
                  alt="WhatsApp QR"
                  style={{ width: 260, height: 260, borderRadius: 12 }}
                />
                <Box sx={{ mt: 3, textAlign: 'left' }}>
                  <Typography variant="body2">1. Open WhatsApp on your phone</Typography>
                  <Typography variant="body2">2. Tap Menu → Linked Devices</Typography>
                  <Typography variant="body2">3. Tap Link a Device and scan this code</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                  QR refreshes automatically every 5 seconds
                </Typography>
              </>
            ) : (
              <Box sx={{ py: 6 }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Preparing QR code…</Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Box>
            {!pairingCode ? (
              <>
                <TextField
                  fullWidth
                  size="small"
                  label="Phone Number"
                  placeholder="e.g. 919876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  inputProps={{ maxLength: 15 }}
                  sx={{ mb: 3 }}
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handlePairing}
                  disabled={requesting}
                >
                  {requesting ? 'Generating…' : 'Generate Pairing Code'}
                </Button>
              </>
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Enter this code in WhatsApp → Linked Devices → Link with phone number
                </Typography>
                <Typography variant="h4" sx={{ my: 3, letterSpacing: 4 }}>
                  {pairingCode.substring(0, 4)} - {pairingCode.substring(4)}
                </Typography>
                <Button variant="outlined" onClick={() => { setPairingCode(''); setPhone(''); }}>
                  Change Number
                </Button>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WhatsappWebQrModal;
