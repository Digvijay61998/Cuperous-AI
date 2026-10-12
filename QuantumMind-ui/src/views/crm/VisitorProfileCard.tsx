// ** React Imports
import { useCallback, useEffect, useState } from 'react';

// ** MUI Imports
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { LoadingButton } from '@mui/lab';

// ** Third Party
import { toast } from 'react-hot-toast';
import Axios from 'src/helper/Axios';
import Icon from 'src/@core/components/icon';

import { FACT_FIELDS, FactKey, parseFactInput, profileView, ProfileEntryView } from './visitorProfile';

interface Props {
  /** Load and edit through /crm/contacts/:id/profile. */
  contactId?: string | null;
  /** Already loaded (agent views get it from /incidents/.../context). Read-only. */
  profile?: any;
  /** Org admins can correct facts and delete entries (R18.12). */
  canEdit?: boolean;
  /** Smaller layout for the agent views. */
  compact?: boolean;
}

const errorText = (e: any) => e?.response?.data?.message || e?.message || 'Something went wrong.';

/**
 * The contact's Visitor_Profile (crm-incident-handover R18.8, R18.12): standing
 * facts, open issues and dated entries, newest first. Replaces earlier
 * transcripts in the agent views. Admins can correct a fact (kept by every
 * later AI merge) or delete an entry.
 */
const VisitorProfileCard = ({ contactId, profile: preloaded, canEdit = false, compact = false }: Props) => {
  const [profile, setProfile] = useState<any>(preloaded ?? null);
  const [loading, setLoading] = useState(!preloaded && !!contactId);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<{ key: FactKey; label: string; text: string; list: boolean } | null>(null);
  const [deleting, setDeleting] = useState<ProfileEntryView | null>(null);
  const [busy, setBusy] = useState(false);
  const editable = canEdit && !!contactId;

  const load = useCallback(async () => {
    if (!contactId || preloaded !== undefined) return;
    setLoading(true);
    setError('');
    try {
      const res = await Axios.get(`crm/contacts/${contactId}/profile`, { timeout: 10_000 });
      setProfile(res.data?.profile ?? null);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, [contactId, preloaded]);

  useEffect(() => {
    if (preloaded !== undefined) setProfile(preloaded);
  }, [preloaded]);
  useEffect(() => {
    load();
  }, [load]);

  const saveFact = async (reset = false) => {
    if (!editing || !contactId) return;
    setBusy(true);
    try {
      const res = reset
        ? await Axios.delete(`crm/contacts/${contactId}/profile/facts/${encodeURIComponent(editing.key)}`)
        : await Axios.put(`crm/contacts/${contactId}/profile/facts`, {
            key: editing.key,
            value: editing.list ? parseFactInput(editing.text) : editing.text.trim() || null,
          });
      setProfile(res.data?.profile ?? null);
      setEditing(null);
      toast.success(reset ? 'The AI will maintain this fact again.' : 'Saved. Later summaries keep your correction.');
    } catch (e) {
      // Keep the dialog and its text so nothing typed is lost.
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting || !contactId) return;
    setBusy(true);
    try {
      const res = await Axios.delete(`crm/contacts/${contactId}/profile/entries/${encodeURIComponent(deleting.key)}`);
      setProfile(res.data?.profile ?? null);
      setDeleting(null);
      toast.success('Entry deleted.');
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }} role="status" aria-label="Loading the visitor profile">
        <CircularProgress size={24} />
      </Box>
    );
  }
  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={load}>
            Retry
          </Button>
        }
      >
        The visitor profile could not be loaded. {error}
      </Alert>
    );
  }

  const view = profileView(profile);
  const gap = compact ? 2 : 3;

  return (
    <Box>
      {view.empty ? (
        <Typography variant="body2" color="text.secondary">
          No profile yet. A summary is added after each finished conversation.
        </Typography>
      ) : null}

      {/* Standing facts */}
      {(!view.empty || editable) && (
        <Box sx={{ mb: gap }}>
          {view.facts.map((f) => {
            if (!f.values.length && !editable) return null;
            return (
              <Box key={f.key} sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 150 }}>
                  {f.label}
                  {f.overridden ? ' (edited)' : ''}
                </Typography>
                {f.values.length ? (
                  f.values.map((v) => <Chip key={v} size="small" label={v} variant="outlined" />)
                ) : (
                  <Typography variant="caption" color="text.disabled">
                    None
                  </Typography>
                )}
                {editable && (
                  <Tooltip title={`Edit ${f.label.toLowerCase()}`}>
                    <IconButton
                      size="small"
                      aria-label={`Edit ${f.label}`}
                      onClick={() =>
                        setEditing({
                          key: f.key,
                          label: f.label,
                          list: FACT_FIELDS.find((x) => x.key === f.key)?.list ?? true,
                          text: f.values.join(', '),
                        })
                      }
                    >
                      <Icon icon="mdi:pencil-outline" fontSize={16} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            );
          })}
        </Box>
      )}

      {view.openIssues.length > 0 && (
        <Box sx={{ mb: gap }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Open issues
          </Typography>
          {view.openIssues.map((i, n) => (
            <Typography key={`${i.ticketRef ?? ''}${n}`} variant="body2">
              {i.text}
              {i.ticketRef ? ` · ${i.ticketRef}` : ''}
              {i.since ? ` · since ${i.since}` : ''}
            </Typography>
          ))}
        </Box>
      )}

      {/* Dated entries, newest first (R18.3) */}
      {view.entries.length > 0 && (
        <Box component="ol" sx={{ listStyle: 'none', p: 0, m: 0 }} aria-label="Conversation history">
          {view.entries.map((e) => (
            <Box component="li" key={e.key} sx={{ py: compact ? 1.5 : 2, borderBottom: (t) => `1px solid ${t.palette.divider}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {[e.date, e.ticketRef, e.outcome, e.bot].filter(Boolean).join(' · ')}
                  {!e.ai ? ' · no AI summary' : ''}
                </Typography>
                {editable && (
                  <Tooltip title="Delete this entry">
                    <IconButton size="small" aria-label={`Delete the entry from ${e.date}`} onClick={() => setDeleting(e)}>
                      <Icon icon="mdi:delete-outline" fontSize={16} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              <Typography variant="body2">{e.summary}</Typography>
              {(e.problem || e.resolution || e.agent) && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {[e.problem && `Problem: ${e.problem}`, e.resolution && `Resolution: ${e.resolution}`, e.agent && `Agent: ${e.agent}`]
                    .filter(Boolean)
                    .join(' · ')}
                </Typography>
              )}
              {!compact && e.tags.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                  {e.tags.map((t) => (
                    <Chip key={t} size="small" label={t} />
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}

      {view.earlier && (
        <Box sx={{ pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Earlier history · {view.earlier.range}
            {view.earlier.count ? ` · ${view.earlier.count} conversations` : ''}
          </Typography>
          <Typography variant="body2">{view.earlier.summary}</Typography>
          {view.earlier.refs.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              References: {view.earlier.refs.join(', ')}
            </Typography>
          )}
        </Box>
      )}

      {/* Edit a fact */}
      <Dialog open={!!editing} onClose={() => !busy && setEditing(null)} aria-labelledby="edit-fact-title" fullWidth maxWidth="sm">
        <DialogTitle id="edit-fact-title">Edit {editing?.label?.toLowerCase()}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            {editing?.list ? 'Separate values with commas. ' : ''}Your correction is kept by every later AI summary.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            multiline={editing?.list}
            minRows={editing?.list ? 2 : undefined}
            label={editing?.label}
            value={editing?.text ?? ''}
            onChange={(ev) => editing && setEditing({ ...editing, text: ev.target.value })}
            inputProps={{ maxLength: editing?.list ? 2100 : 20 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => saveFact(true)} disabled={busy}>
            Let the AI maintain it
          </Button>
          <Button onClick={() => setEditing(null)} disabled={busy}>
            Cancel
          </Button>
          <LoadingButton variant="contained" loading={busy} onClick={() => saveFact(false)}>
            Save
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Delete an entry */}
      <Dialog open={!!deleting} onClose={() => !busy && setDeleting(null)} aria-labelledby="delete-entry-title">
        <DialogTitle id="delete-entry-title">Delete this entry?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleting?.date}: {deleting?.summary}
          </DialogContentText>
          <DialogContentText sx={{ mt: 2 }}>This cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleting(null)} disabled={busy}>
            Cancel
          </Button>
          <LoadingButton color="error" variant="contained" loading={busy} onClick={confirmDelete}>
            Delete
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VisitorProfileCard;
