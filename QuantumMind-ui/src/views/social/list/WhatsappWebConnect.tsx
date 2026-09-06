// ** WhatsApp Web connect flow used inside the Add Messenger drawer.
// Ports OpenWA's "New Session -> card -> Start -> Scan QR" flow: creates the
// session, starts the engine, and opens the QR / phone-pairing modal.
import { useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { toast } from 'react-hot-toast';
import {
  createWhatsappWebSession,
  startWhatsappWebSession,
  WhatsappWebSession,
} from 'src/store/apps/whatsapp-web';
import WhatsappWebQrModal from './WhatsappWebQrModal';

interface Props {
  name: string;
  jarcubeBot: string;
  /** Provided in edit mode so the drawer can resume an existing session. */
  existingSession?: WhatsappWebSession | null;
  onDone: () => void;
}

/** Derive a valid session name (OpenWA rule: lowercase letters, digits, hyphens). */
export const slugifySessionName = (value: string): string =>
  (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);

const sessionId = (s?: WhatsappWebSession | null) => s?.id || (s as any)?._id;

const WhatsappWebConnect = (props: Props) => {
  const { name, jarcubeBot, existingSession, onDone } = props;

  const [session, setSession] = useState<WhatsappWebSession | null>(
    existingSession || null,
  );
  const [busy, setBusy] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const derivedName = useMemo(() => slugifySessionName(name), [name]);
  const nameValid = derivedName.length >= 3;

  const currentStatus =
    session?.liveStatus || session?.status || 'created';
  const isConnected = currentStatus === 'ready';

  const handleCreateAndConnect = async () => {
    if (busy) return;
    if (!nameValid) {
      toast.error('Name must produce at least 3 letters/digits');
      return;
    }
    if (!jarcubeBot) {
      toast.error('Select a JarCube Bot first');
      return;
    }
    try {
      setBusy(true);
      const created = await createWhatsappWebSession({
        name: derivedName,
        jarcubeBot,
      });
      const id = sessionId(created);
      const started = await startWhatsappWebSession(id as string);
      setSession(started);
      setQrOpen(true);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Failed to create session',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleShowQr = async () => {
    if (!session) return;
    try {
      setBusy(true);
      if (!session.engineLoaded) {
        await startWhatsappWebSession(sessionId(session) as string);
      }
      setQrOpen(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to start');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 4 }}>
        WhatsApp Web links a personal WhatsApp number by scanning a QR code (or a
        phone pairing code). No access token is required.
      </Alert>

      {!session ? (
        <>
          {name ? (
            <Typography variant="body2" sx={{ mb: 3 }}>
              Session name: <strong>{derivedName || '—'}</strong>
            </Typography>
          ) : null}
          <Button
            fullWidth
            variant="contained"
            disabled={busy || !nameValid || !jarcubeBot}
            onClick={handleCreateAndConnect}
          >
            {busy ? 'Creating…' : 'Create & Connect'}
          </Button>
        </>
      ) : (
        <Box
          sx={{
            border: (theme) => `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: 4,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1">{session.name}</Typography>
            <Chip
              size="small"
              label={isConnected ? 'Connected' : currentStatus}
              color={isConnected ? 'success' : 'warning'}
            />
          </Box>
          {session.phone && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              Phone: {session.phone}
            </Typography>
          )}
          {isConnected ? (
            <Button fullWidth variant="contained" color="success" onClick={onDone}>
              Done
            </Button>
          ) : (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" disabled={busy} onClick={handleShowQr}>
                Show QR
              </Button>
              <Button variant="outlined" onClick={onDone}>
                Close
              </Button>
            </Box>
          )}
        </Box>
      )}

      {session && (
        <WhatsappWebQrModal
          open={qrOpen}
          sessionId={sessionId(session) as string}
          sessionName={session.name}
          onClose={() => setQrOpen(false)}
          onConnected={() => {
            onDone();
          }}
        />
      )}
    </Box>
  );
};

export default WhatsappWebConnect;
