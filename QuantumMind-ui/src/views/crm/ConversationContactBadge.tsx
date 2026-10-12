// ** React Imports
import { FormEvent, useCallback, useEffect, useState } from 'react';

// ** Next Imports
import Link from 'next/link';

// ** MUI Imports
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { LoadingButton } from '@mui/lab';

// ** Third Party
import { toast } from 'react-hot-toast';
import Axios from 'src/helper/Axios';

// ** Helpers
import {
  DetailsInput,
  DetailsValidation,
  HeaderState,
  headerStateFrom,
  isConversationId,
  serverMessage,
  validateDetails,
} from './contactLinks';

interface Props {
  /** The conversation's Mongo id. Nothing is fetched or rendered without a real one. */
  conversationId?: string | null;
}

/**
 * The CRM contact for a conversation, shown in the agent view header (R3.4, R3.8).
 *
 * Linked: the contact name links to its CRM page, plus an "Anonymous" chip and an
 * "Add details" button when the contact has no identity yet (R20.2).
 * Unavailable (archived or deleted): plain text, no link.
 * Not linked, or the lookup failed: renders nothing, so the agent view never breaks.
 */
const ConversationContactBadge = ({ conversationId }: Props) => {
  const [state, setState] = useState<HeaderState>({ kind: 'none' });
  const [dialogOpen, setDialogOpen] = useState(false);

  const validId = isConversationId(conversationId) ? conversationId : null;

  const load = useCallback(
    async (signal?: { cancelled: boolean }) => {
      if (!validId) {
        setState({ kind: 'none' });
        return;
      }
      try {
        const res = await Axios.get(
          `/crm/conversations/${encodeURIComponent(validId)}/contact`,
        );
        if (!signal?.cancelled) setState(headerStateFrom(res?.data));
      } catch {
        // Deliberately silent: a CRM outage must not disturb the agent view.
        if (!signal?.cancelled) setState({ kind: 'none' });
      }
    },
    [validId],
  );

  useEffect(() => {
    const signal = { cancelled: false };
    setState({ kind: 'none' });
    setDialogOpen(false);
    load(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [load]);

  if (!validId || state.kind === 'none') return null;

  if (state.kind === 'unavailable') {
    return (
      <Typography variant="caption" sx={{ color: 'text.disabled', ml: 2 }}>
        CRM contact unavailable
      </Typography>
    );
  }

  return (
    <Box
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, ml: 2 }}
      onClick={(e) => e.stopPropagation()}
    >
      <Link href={`/crm/contacts/${encodeURIComponent(state.id)}`} passHref>
        <Typography
          component="a"
          variant="caption"
          title="Open CRM contact"
          sx={{ color: 'primary.main', fontWeight: 500, textDecoration: 'none' }}
        >
          {state.name}
        </Typography>
      </Link>
      {state.isAnonymous && (
        <>
          <Chip size="small" label="Anonymous" variant="outlined" />
          <Button size="small" variant="text" onClick={() => setDialogOpen(true)}>
            Add details
          </Button>
          <AddDetailsDialog
            open={dialogOpen}
            conversationId={validId}
            onClose={() => setDialogOpen(false)}
            onSaved={(res) => {
              setDialogOpen(false);
              if (res?.queued) {
                toast.success('Saved; it will appear shortly.');
                return;
              }
              toast.success('Contact details saved');
              const next = headerStateFrom(res);
              if (next.kind !== 'none') setState(next);
              load();
            }}
          />
        </>
      )}
    </Box>
  );
};

const EMPTY: DetailsInput = { name: '', email: '', phone: '' };

const AddDetailsDialog = ({
  open,
  conversationId,
  onClose,
  onSaved,
}: {
  open: boolean;
  conversationId: string;
  onClose: () => void;
  onSaved: (res: any) => void;
}) => {
  const [values, setValues] = useState<DetailsInput>(EMPTY);
  const [errors, setErrors] = useState<DetailsValidation['errors']>({});
  const [serverError, setServerError] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // A fresh form each time the dialog opens; kept as-is while it stays open so
  // a failed save never discards what the agent typed.
  useEffect(() => {
    if (open) {
      setValues(EMPTY);
      setErrors({});
      setServerError('');
    }
  }, [open]);

  const change = (field: keyof DetailsInput) => (e: any) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const check = validateDetails(values);
    setErrors(check.errors);
    setServerError('');
    if (!check.ok) return;

    setSaving(true);
    try {
      const res = await Axios.post(
        `/crm/conversations/${encodeURIComponent(conversationId)}/contact/details`,
        check.payload,
      );
      onSaved(res?.data);
    } catch (error: any) {
      setServerError(serverMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      aria-labelledby="add-contact-details-title"
      fullWidth
      maxWidth="xs"
    >
      <form onSubmit={submit} noValidate>
        <DialogTitle id="add-contact-details-title">Add contact details</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Fill in at least one field.
          </Typography>
          {(errors.form || serverError) && (
            <Alert severity="error" sx={{ mb: 3 }} role="alert">
              {errors.form || serverError}
            </Alert>
          )}
          <TextField
            id="contact-details-name"
            label="Name"
            fullWidth
            size="small"
            autoFocus
            value={values.name}
            onChange={change('name')}
            error={!!errors.name}
            helperText={errors.name}
            inputProps={{ maxLength: 200, autoComplete: 'name' }}
            sx={{ mb: 3 }}
          />
          <TextField
            id="contact-details-email"
            label="Email"
            type="email"
            fullWidth
            size="small"
            value={values.email}
            onChange={change('email')}
            error={!!errors.email}
            helperText={errors.email}
            inputProps={{ maxLength: 254, autoComplete: 'email' }}
            sx={{ mb: 3 }}
          />
          <TextField
            id="contact-details-phone"
            label="Phone"
            type="tel"
            fullWidth
            size="small"
            value={values.phone}
            onChange={change('phone')}
            error={!!errors.phone}
            helperText={errors.phone}
            inputProps={{ maxLength: 32, autoComplete: 'tel' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <LoadingButton type="submit" variant="contained" loading={saving}>
            Save
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ConversationContactBadge;
