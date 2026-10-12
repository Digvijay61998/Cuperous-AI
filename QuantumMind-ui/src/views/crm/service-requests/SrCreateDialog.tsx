// ** Log a request by hand, e.g. from a phone call (crm-plugins-service-desk R11, R19.5)
import { useEffect, useState } from 'react';

import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';

import { useDispatch, useSelector } from 'react-redux';
import Axios from 'src/helper/Axios';
import { AppDispatch, RootState } from 'src/store';
import { createSr, fetchSrAssignees, SrDetail, SrState } from 'src/store/apps/crm-service-requests';
import { PRIORITY_OPTIONS } from './srFilters';

interface Props {
  open: boolean;
  onClose: (created?: SrDetail) => void;
  /** Pre-link a contact (from the contact page). */
  contactId?: string;
}

const EMPTY = { subject: '', description: '', priority: 'MEDIUM', emergency: false, tags: [] as string[], assigneeId: 'me' };

const SrCreateDialog = ({ open, onClose, contactId }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const { assignees, me } = useSelector((s: RootState) => (s as any).crmServiceRequests as SrState);
  const [form, setForm] = useState(EMPTY);
  const [contact, setContact] = useState<{ id: string; label: string } | null>(null);
  const [opts, setOpts] = useState<{ id: string; label: string }[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(EMPTY);
    setContact(null);
    if (!assignees) dispatch(fetchSrAssignees());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || contactId || input.trim().length < 2) return;
    let live = true;
    const t = setTimeout(async () => {
      try {
        const r = await Axios.get('crm/contacts', { params: { q: input.trim(), page: 1, pageSize: 10 } });
        if (live) {
          setOpts(
            (r.data?.data || []).map((c: any) => ({
              id: c.id || c._id,
              label: `${[c.firstName, c.lastName].filter(Boolean).join(' ') || 'Unnamed contact'}${c.email ? ` · ${c.email}` : ''}`,
            })),
          );
        }
      } catch {
        if (live) setOpts([]);
      }
    }, 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [input, open, contactId]);

  const subject = form.subject.trim();
  const submit = async () => {
    if (!subject) return;
    setBusy(true);
    const assigneeId = form.assigneeId === 'me' ? me : form.assigneeId || undefined;
    const res = await dispatch(
      createSr({
        subject,
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
        priority: form.priority,
        emergency: form.emergency,
        tags: form.tags,
        ...(assigneeId ? { assigneeId } : {}),
        ...(contactId || contact?.id ? { contactId: contactId || contact?.id } : {}),
      }),
    );
    setBusy(false);
    if (createSr.fulfilled.match(res)) onClose(res.payload);
  };

  return (
    <Dialog open={open} onClose={() => onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>New service request</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'grid', gap: 4, pt: 2 }}>
          <TextField
            autoFocus
            required
            size="small"
            label="Subject"
            value={form.subject}
            inputProps={{ maxLength: 200 }}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
          <TextField
            multiline
            minRows={3}
            size="small"
            label="Description"
            value={form.description}
            inputProps={{ maxLength: 10000 }}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <TextField
              select
              size="small"
              label="Priority"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: String(e.target.value) })}
            >
              {PRIORITY_OPTIONS.map((p) => (
                <MenuItem key={p} value={p}>
                  {p[0] + p.slice(1).toLowerCase()}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              label="Assignee"
              value={form.assigneeId}
              onChange={(e) => setForm({ ...form, assigneeId: String(e.target.value) })}
            >
              <MenuItem value="me">Me</MenuItem>
              <MenuItem value="">Unassigned</MenuItem>
              {(assignees || [])
                .filter((a) => a.id !== me)
                .map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.name || a.email}
                  </MenuItem>
                ))}
            </TextField>
          </Box>
          {!contactId && (
            <Autocomplete
              size="small"
              options={opts}
              value={contact}
              filterOptions={(x) => x}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              getOptionLabel={(o) => o.label}
              onInputChange={(_e, v) => setInput(v)}
              onChange={(_e, v) => setContact(v)}
              noOptionsText={input.trim().length < 2 ? 'Type a name, email or phone' : 'No contacts found'}
              renderInput={(p) => <TextField {...p} label="Contact (optional)" />}
            />
          )}
          <Autocomplete
            multiple
            freeSolo
            size="small"
            options={[] as string[]}
            value={form.tags}
            onChange={(_e, v) => setForm({ ...form, tags: (v as string[]).map((t) => t.trim()).filter(Boolean).slice(0, 20) })}
            renderInput={(p) => <TextField {...p} label="Tags" placeholder="Add a tag and press Enter" />}
          />
          <FormControlLabel
            control={<Switch checked={form.emergency} onChange={(e) => setForm({ ...form, emergency: e.target.checked })} />}
            label="Emergency"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose()}>Cancel</Button>
        <Button variant="contained" disabled={busy || !subject} onClick={() => void submit()}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SrCreateDialog;
