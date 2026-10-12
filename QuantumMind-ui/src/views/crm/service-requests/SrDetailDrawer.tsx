// ** Request detail drawer (crm-plugins-service-desk R13.2, R14, R15.3, R15.5, R16.3)
import { useEffect, useState } from 'react';
import Link from 'next/link';

import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import Icon from 'src/@core/components/icon';
import Axios from 'src/helper/Axios';
import { AppDispatch, RootState } from 'src/store';
import {
  addSrComment,
  assignSr,
  assignSrToMe,
  closeSrDetail,
  deleteSrComment,
  editSrComment,
  fetchSrAssignees,
  fetchSrComments,
  fetchSrDetail,
  fetchSrEvents,
  fetchSrStages,
  fetchSrTranscript,
  moveSr,
  openSrDetail,
  regenerateSrSummary,
  SrDetail,
  SrPatch,
  SrState,
  updateSr,
} from 'src/store/apps/crm-service-requests';
import { canManagePlugins } from 'src/views/crm/plugins/crmPlugins';
import { channelLabel, contactName, PRIORITY_OPTIONS, SOURCE_OPTIONS } from './srFilters';
import { Section, SrComments, SrHistoryList, SrSummaryCard, SrTranscriptView } from './SrDrawerParts';

interface Props {
  id: string | null;
  onClose: () => void;
}

const when = (d?: string | null) => (d ? new Date(d).toLocaleString() : '—');

const SrDetailDrawer = ({ id, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const st = useSelector((s: RootState) => (s as any).crmServiceRequests as SrState);
  const role = useSelector((s: RootState) => (s.user as any)?.userData?.role);
  const staff = canManagePlugins(role);
  const { detail, stages, assignees, me, gap } = st;
  const sr = detail.id === id ? detail.data : null;

  useEffect(() => {
    dispatch(id ? openSrDetail(id) : closeSrDetail());
  }, [dispatch, id]);

  useEffect(() => {
    if (!id) return;
    dispatch(fetchSrDetail(id));
    dispatch(fetchSrComments(id));
    dispatch(fetchSrEvents({ id }));
    dispatch(fetchSrTranscript(id));
  }, [dispatch, id, gap]);

  useEffect(() => {
    if (!id) return;
    if (!stages) dispatch(fetchSrStages());
    if (!assignees) dispatch(fetchSrAssignees());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const patch = (p: SrPatch) => sr && dispatch(updateSr({ id: sr.id, patch: p }));

  return (
    <Drawer
      anchor="right"
      open={!!id}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 560, md: 640 } } }}
      ModalProps={{ keepMounted: false }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', px: 5, py: 3, borderBottom: (t) => `1px solid ${t.palette.divider}` }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          {sr?.ref || 'Service request'}
        </Typography>
        {sr && (
          <Tooltip title="Copy link" arrow>
            <IconButton
              aria-label="Copy link"
              onClick={() => {
                void navigator.clipboard
                  ?.writeText(`${window.location.origin}/crm/service-requests/${sr.id}`)
                  .then(() => toast.success('Link copied'));
              }}
            >
              <Icon icon="bx:link" />
            </IconButton>
          </Tooltip>
        )}
        <IconButton aria-label="Close" onClick={onClose}>
          <Icon icon="bx:x" />
        </IconButton>
      </Box>

      <Box sx={{ px: 5, py: 4, overflowY: 'auto', flex: 1 }}>
        {detail.error === 'missing' && (
          <Alert severity="warning">This request no longer exists or belongs to another organization.</Alert>
        )}
        {detail.error && detail.error !== 'missing' && !sr && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => id && dispatch(fetchSrDetail(id))}>
                Retry
              </Button>
            }
          >
            {detail.error}
          </Alert>
        )}
        {!sr && !detail.error && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        )}
        {sr && detail.error !== 'missing' && (
          <>
            <EditableText
              key={`s-${sr.id}`}
              label="Subject"
              value={sr.subject}
              max={200}
              required
              onSave={(v) => patch({ subject: v })}
              variant="subject"
            />
            <EditableText
              key={`d-${sr.id}`}
              label="Description"
              value={sr.description || ''}
              max={10000}
              multiline
              onSave={(v) => patch({ description: v || null })}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mb: 5 }}>
              <TextField
                select
                size="small"
                label="Stage"
                value={stages?.some((s) => s.id === sr.stageId) ? sr.stageId : ''}
                onChange={(e) => {
                  const stageId = String(e.target.value);
                  if (stageId && stageId !== sr.stageId) dispatch(moveSr({ id: sr.id, target: { stageId, index: 0 } }));
                }}
              >
                {(stages || [sr.stage]).map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                label="Priority"
                value={sr.priority}
                onChange={(e) => patch({ priority: String(e.target.value) })}
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <MenuItem key={p} value={p}>
                    {p[0] + p.slice(1).toLowerCase()}
                  </MenuItem>
                ))}
              </TextField>
              <AssigneeField sr={sr} me={me} />
              <FormControlLabel
                control={<Switch checked={sr.emergency} onChange={(e) => patch({ emergency: e.target.checked })} />}
                label="Emergency"
              />
              <Autocomplete
                multiple
                freeSolo
                size="small"
                options={[] as string[]}
                value={sr.tags || []}
                onChange={(_e, v) => patch({ tags: (v as string[]).map((t) => t.trim()).filter(Boolean) })}
                renderInput={(p) => <TextField {...p} label="Tags" placeholder="Add a tag and press Enter" />}
                sx={{ gridColumn: '1 / -1' }}
              />
            </Box>

            <ContactBlock sr={sr} staff={staff} onLink={(contactId) => patch({ contactId })} />

            <Section title="Details">
              <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: 1.5 }}>
                <Meta k="Bot" v={sr.botName || '—'} />
                <Meta k="Channel" v={channelLabel(sr.channel)} />
                <Meta k="Source" v={SOURCE_OPTIONS.find((o) => o.value === sr.source)?.label ?? sr.source} />
                <Meta k="Created" v={when(sr.createdAt)} />
                <Meta k="Updated" v={when(sr.updatedAt)} />
                {sr.firstResponseAt && <Meta k="First response" v={when(sr.firstResponseAt)} />}
                {sr.closedAt && <Meta k="Closed" v={when(sr.closedAt)} />}
              </Box>
            </Section>

            <Divider sx={{ mb: 5 }} />
            <SrSummaryCard sr={sr} loading={detail.summaryLoading} onRegenerate={() => dispatch(regenerateSrSummary(sr.id))} />
            <SrTranscriptView transcript={detail.transcript} loading={!detail.transcript} />
            <SrComments
              comments={detail.comments}
              me={me}
              staff={staff}
              onAdd={async (body) => addSrComment.fulfilled.match(await dispatch(addSrComment({ id: sr.id, body })))}
              onEdit={async (commentId, body) =>
                editSrComment.fulfilled.match(await dispatch(editSrComment({ id: sr.id, commentId, body })))
              }
              onDelete={(commentId) => dispatch(deleteSrComment({ id: sr.id, commentId }))}
            />
            <SrHistoryList
              events={detail.events}
              onMore={() => dispatch(fetchSrEvents({ id: sr.id, skip: detail.events?.data.length ?? 0 }))}
            />
          </>
        )}
      </Box>
    </Drawer>
  );
};

const Meta = ({ k, v }: { k: string; v: string }) => (
  <>
    <Typography variant="body2" color="text.secondary">
      {k}
    </Typography>
    <Typography variant="body2">{v}</Typography>
  </>
);

/** Click-to-edit text; saves on Save / Enter, Escape cancels. */
const EditableText = ({
  label,
  value,
  max,
  required,
  multiline,
  variant,
  onSave,
}: {
  label: string;
  value: string;
  max: number;
  required?: boolean;
  multiline?: boolean;
  variant?: 'subject';
  onSave: (v: string) => void;
}) => {
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState(value);
  useEffect(() => {
    if (!edit) setV(value);
  }, [value, edit]);
  const trimmed = v.trim();
  const invalid = (required && !trimmed) || trimmed.length > max;
  const save = () => {
    if (invalid) return;
    if (trimmed !== value) onSave(trimmed);
    setEdit(false);
  };
  if (!edit) {
    return (
      <Box
        role="button"
        tabIndex={0}
        aria-label={`Edit ${label.toLowerCase()}`}
        onClick={() => setEdit(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') setEdit(true);
        }}
        sx={{ mb: 4, p: 1, mx: -1, borderRadius: 1, cursor: 'text', '&:hover': { bgcolor: 'action.hover' } }}
      >
        {variant !== 'subject' && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {label}
          </Typography>
        )}
        <Typography
          variant={variant === 'subject' ? 'h6' : 'body2'}
          color={value ? 'text.primary' : 'text.disabled'}
          sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        >
          {value || `Add a ${label.toLowerCase()}`}
        </Typography>
      </Box>
    );
  }
  return (
    <Box sx={{ mb: 4 }}>
      <TextField
        autoFocus
        fullWidth
        size="small"
        label={label}
        value={v}
        multiline={multiline}
        minRows={multiline ? 3 : undefined}
        error={invalid}
        helperText={trimmed.length > max ? `At most ${max} characters` : required && !trimmed ? 'Required' : ' '}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            setEdit(false);
          } else if (e.key === 'Enter' && (!multiline || e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            save();
          }
        }}
      />
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button size="small" variant="contained" disabled={invalid} onClick={save}>
          Save
        </Button>
        <Button size="small" onClick={() => setEdit(false)}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

/** Assignee picker with "Assign to me" (R13.2, R13.3). */
const AssigneeField = ({ sr, me }: { sr: SrDetail; me: string | null }) => {
  const dispatch = useDispatch<AppDispatch>();
  const assignees = useSelector((s: RootState) => ((s as any).crmServiceRequests as SrState).assignees) || [];
  const options = [{ id: '', name: 'Unassigned' }, ...assignees];
  const value =
    options.find((a) => a.id === (sr.assigneeId || '')) ??
    (sr.assigneeId ? { id: sr.assigneeId, name: sr.assigneeName || 'Former user' } : options[0]);
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
      <Autocomplete
        size="small"
        disableClearable
        options={options}
        value={value}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        getOptionLabel={(o) => o.name || (o as any).email || o.id}
        onChange={(_e, v) => {
          const next = v?.id || null;
          if (next !== (sr.assigneeId || null)) dispatch(assignSr({ id: sr.id, assigneeId: next }));
        }}
        renderInput={(p) => <TextField {...p} label="Assignee" />}
        sx={{ flex: 1 }}
      />
      {me && sr.assigneeId !== me && (
        <Button size="small" sx={{ mt: 0.5, whiteSpace: 'nowrap' }} onClick={() => dispatch(assignSrToMe(sr.id))}>
          Assign to me
        </Button>
      )}
    </Box>
  );
};

/**
 * The linked contact (R14.1, R14.5). Staff get a link to the contact page;
 * agents only see the details (they cannot open Contacts, R17.2).
 */
const ContactBlock = ({ sr, staff, onLink }: { sr: SrDetail; staff: boolean; onLink: (contactId: string | null) => void }) => {
  const [linking, setLinking] = useState(false);
  const [input, setInput] = useState('');
  const [opts, setOpts] = useState<{ id: string; label: string }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!linking || input.trim().length < 2) return;
    let live = true;
    setBusy(true);
    const t = setTimeout(async () => {
      try {
        const r = await Axios.get('crm/contacts', { params: { q: input.trim(), page: 1, pageSize: 10 } });
        const rows: any[] = r.data?.data || [];
        if (live) {
          setOpts(
            rows.map((c) => ({
              id: c.id || c._id,
              label: `${[c.firstName, c.lastName].filter(Boolean).join(' ') || 'Unnamed contact'}${c.email ? ` · ${c.email}` : c.phone ? ` · ${c.phone}` : ''}`,
            })),
          );
        }
      } catch (e: any) {
        if (live) {
          setOpts([]);
          if (e?.response?.status === 403) toast.error('You cannot search contacts.');
        }
      } finally {
        if (live) setBusy(false);
      }
    }, 300);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [input, linking]);

  const c = sr.contact;
  const name = contactName(c);
  return (
    <Section
      title="Contact"
      action={
        c ? (
          <Button
            size="small"
            color="secondary"
            onClick={() => {
              if (window.confirm('Unlink this contact from the request?')) onLink(null);
            }}
          >
            Unlink
          </Button>
        ) : undefined
      }
    >
      {c ? (
        <Box>
          {staff ? (
            <Link href={`/crm/contacts/${c.id}`} passHref>
              <Typography component="a" variant="body2" sx={{ fontWeight: 500, color: 'primary.main' }}>
                {name}
              </Typography>
            </Link>
          ) : (
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {name}
            </Typography>
          )}
          {c.email && (
            <Typography variant="body2" color="text.secondary">
              {c.email}
            </Typography>
          )}
          {c.phone && (
            <Typography variant="body2" color="text.secondary">
              {c.phone}
            </Typography>
          )}
        </Box>
      ) : (
        <Box>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
            Not linked
          </Typography>
          {!linking ? (
            <Button size="small" variant="outlined" startIcon={<Icon icon="bx:link" />} onClick={() => setLinking(true)}>
              Link a contact
            </Button>
          ) : (
            <Autocomplete
              size="small"
              open
              options={opts}
              loading={busy}
              filterOptions={(x) => x}
              getOptionLabel={(o) => o.label}
              onInputChange={(_e, v) => setInput(v)}
              onChange={(_e, v) => {
                if (v?.id) {
                  onLink(v.id);
                  setLinking(false);
                }
              }}
              onClose={() => setLinking(false)}
              noOptionsText={input.trim().length < 2 ? 'Type a name, email or phone' : 'No contacts found'}
              renderInput={(p) => <TextField {...p} autoFocus label="Find a contact" />}
            />
          )}
        </Box>
      )}
    </Section>
  );
};

export default SrDetailDrawer;
