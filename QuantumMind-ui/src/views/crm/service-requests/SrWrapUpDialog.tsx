// ** Confirm the chat's service request before closing / releasing it (owner request)
import { useEffect, useState } from 'react';

import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { toast } from 'react-hot-toast';
import Icon from 'src/@core/components/icon';
import Axios from 'src/helper/Axios';
import { errorText, SrDetail } from 'src/store/apps/crm-service-requests';
import { PRIORITY_OPTIONS } from './srFilters';
import {
  formFromDraft,
  WRAP_DESCRIPTION_MAX,
  WRAP_SUBJECT_MAX,
  wrapUpBody,
  wrapUpError,
  wrapUpLabels,
  WrapUpForm,
  WrapUpMode,
} from './wrapUp';

interface Props {
  open: boolean;
  mode: WrapUpMode;
  /** The chat: a conversation id, an inbox thread id, or both. */
  conversationId?: string | null;
  threadId?: string | null;
  onCancel: () => void;
  /** Called after the card was saved; the caller then closes / releases. */
  onSaved: (request: SrDetail) => void;
}

const SrWrapUpDialog = ({ open, mode, conversationId, threadId, onCancel, onSaved }: Props) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [request, setRequest] = useState<SrDetail | null>(null);
  const [ai, setAi] = useState<{ on: boolean; error: string | null }>({ on: false, error: null });
  const [form, setForm] = useState<WrapUpForm>(formFromDraft(null, mode));
  const [tried, setTried] = useState(false);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const r = await Axios.get('crm/service-requests/wrap-up', {
        params: { ...(conversationId ? { conversationId } : {}), ...(threadId ? { threadId } : {}) },
      });
      setRequest(r.data?.request ?? null);
      setAi({ on: !!r.data?.ai, error: r.data?.aiError ?? null });
      setForm(formFromDraft(r.data?.draft, mode));
    } catch (e) {
      setLoadError(errorText(e, 'Could not load the service request for this chat.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setTried(false);
    setRequest(null);
    setForm(formFromDraft(null, mode));
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, conversationId, threadId, mode]);

  const error = wrapUpError(form);
  const labels = wrapUpLabels(mode, !!request);

  const save = async () => {
    setTried(true);
    if (error) return;
    setSaving(true);
    try {
      const r = await Axios.post('crm/service-requests/wrap-up', wrapUpBody(form, { conversationId, threadId }));
      toast.success(`Service request${r.data?.ref ? ` ${r.data.ref}` : ''} saved`);
      onSaved(r.data as SrDetail);
    } catch (e) {
      toast.error(errorText(e, 'Could not save the service request'));
    } finally {
      setSaving(false);
    }
  };

  const set = (p: Partial<WrapUpForm>) => setForm((f) => ({ ...f, ...p }));

  return (
    <Dialog open={open} onClose={saving ? undefined : onCancel} maxWidth="sm" fullWidth aria-labelledby="sr-wrap-up-title">
      <DialogTitle id="sr-wrap-up-title">
        {labels.title}
        {request?.ref && (
          <Typography variant="body2" color="text.secondary">
            {request.ref} · {request.stage?.name}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 6, justifyContent: 'center' }}>
            <CircularProgress size={22} />
            <Typography variant="body2" color="text.secondary">
              The AI is filling in the details from the conversation…
            </Typography>
          </Box>
        )}
        {!loading && loadError && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => void load()}>
                Retry
              </Button>
            }
          >
            {loadError}
          </Alert>
        )}
        {!loading && !loadError && (
          <Box sx={{ display: 'grid', gap: 4, pt: 1 }}>
            {ai.on ? (
              <Alert severity="info" icon={<Icon icon="bx:bot" />}>
                The AI filled this in from the conversation. Check it and correct anything that is wrong.
              </Alert>
            ) : (
              <Alert severity="warning">{ai.error || 'Please fill in the details of this request.'}</Alert>
            )}
            <TextField
              required
              size="small"
              label="Subject"
              value={form.subject}
              inputProps={{ maxLength: WRAP_SUBJECT_MAX }}
              error={tried && !form.subject.trim()}
              onChange={(e) => set({ subject: e.target.value })}
            />
            <TextField
              required
              multiline
              minRows={5}
              size="small"
              label="What the customer needed and what was done"
              value={form.description}
              inputProps={{ maxLength: WRAP_DESCRIPTION_MAX }}
              error={tried && !form.description.trim()}
              onChange={(e) => set({ description: e.target.value })}
            />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, alignItems: 'center' }}>
              <TextField select size="small" label="Priority" value={form.priority} onChange={(e) => set({ priority: String(e.target.value) })}>
                {PRIORITY_OPTIONS.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p[0] + p.slice(1).toLowerCase()}
                  </MenuItem>
                ))}
              </TextField>
              <FormControlLabel
                control={<Switch checked={form.emergency} onChange={(e) => set({ emergency: e.target.checked })} />}
                label="Emergency"
              />
            </Box>
            <Autocomplete
              multiple
              freeSolo
              size="small"
              options={[] as string[]}
              value={form.tags}
              onChange={(_e, v) => set({ tags: (v as string[]).map((t) => t.trim()).filter(Boolean).slice(0, 20) })}
              renderInput={(p) => <TextField {...p} label="Tags" placeholder="Add a tag and press Enter" />}
            />
            <Box>
              <Typography variant="subtitle2" id="sr-wrap-up-outcome">
                Status
              </Typography>
              <RadioGroup
                row
                aria-labelledby="sr-wrap-up-outcome"
                value={form.outcome}
                onChange={(e) => set({ outcome: e.target.value as WrapUpForm['outcome'] })}
              >
                <FormControlLabel value="resolved" control={<Radio />} label="Resolved (closes the request)" />
                <FormControlLabel value="open" control={<Radio />} label="Still open (stays on the board)" />
              </RadioGroup>
            </Box>
            <FormControlLabel
              control={<Checkbox checked={form.confirmed} onChange={(e) => set({ confirmed: e.target.checked })} />}
              label={ai.on ? 'I checked the AI-filled details and they are correct' : 'I checked these details and they are correct'}
            />
            {tried && error && (
              <Typography variant="body2" color="error" role="alert">
                {error}
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => void save()} disabled={loading || !!loadError || saving}>
          {saving ? <CircularProgress size={18} /> : labels.action}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SrWrapUpDialog;
