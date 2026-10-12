// ** Board stages for org admins and managers (crm-plugins-service-desk R10.2–R10.5)
import { useEffect, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'src/@core/components/icon';
import Axios from 'src/helper/Axios';
import { AppDispatch, RootState } from 'src/store';
import { errorText, fetchSrStages, setSrStages, SrStage, SrState } from 'src/store/apps/crm-service-requests';
import { CATEGORY_OPTIONS } from './srFilters';
import { categoryBlocker, defaultMoveTarget, deleteBlocker, moveStageId, stageFieldError } from './stageEdit';

interface Props {
  open: boolean;
  onClose: (changed: boolean) => void;
}

const base = 'crm/service-request-stages';

const StageManagerDialog = ({ open, onClose }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const stages = useSelector((s: RootState) => ((s as any).crmServiceRequests as SrState).stages) || [];
  const [busy, setBusy] = useState(false);
  const [changed, setChanged] = useState(false);
  const [names, setNames] = useState<Record<string, string>>({});
  const [colors, setColors] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState({ name: '', category: 'IN_PROGRESS', color: '#8592A3' });
  const [removing, setRemoving] = useState<{ id: string; moveTo: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    setChanged(false);
    setNames({});
    setColors({});
    dispatch(fetchSrStages());
  }, [open, dispatch]);

  /** Every write returns the full stage list. */
  const run = async (call: () => Promise<any>, ok?: string) => {
    setBusy(true);
    try {
      const r = await call();
      dispatch(setSrStages(r.data));
      setChanged(true);
      if (ok) toast.success(ok);
      return true;
    } catch (e) {
      toast.error(errorText(e, 'Could not save the stage'));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const update = (s: SrStage, body: Record<string, any>) => run(() => Axios.patch(`${base}/${encodeURIComponent(s.id)}`, body));

  const saveName = (s: SrStage) => {
    const v = names[s.id];
    if (v === undefined || v.trim() === s.name) return;
    const err = stageFieldError(stages, s.id, v);
    if (err) return toast.error(err);
    void update(s, { name: v.trim() }).then((ok) => {
      if (!ok) return;
      setNames((n) => {
        const next = { ...n };
        delete next[s.id];
        return next;
      });
    });
  };

  const add = async () => {
    const err = stageFieldError(stages, null, adding.name, adding.color);
    if (err) return toast.error(err);
    if (await run(() => Axios.post(base, { name: adding.name.trim(), category: adding.category, color: adding.color }), 'Stage added')) {
      setAdding({ name: '', category: 'IN_PROGRESS', color: '#8592A3' });
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    const ok = await run(
      () => Axios.delete(`${base}/${encodeURIComponent(removing.id)}`, { params: removing.moveTo ? { moveTo: removing.moveTo } : {} }),
      'Stage deleted',
    );
    if (ok) setRemoving(null);
  };

  const removingStage = stages.find((s) => s.id === removing?.id);

  return (
    <Dialog open={open} onClose={() => onClose(changed)} maxWidth="md" fullWidth>
      <DialogTitle>Board stages</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          The category decides what a stage means: Open for new requests, Done closes the request (and its chat
          handover). New requests go to the default stage.
        </Typography>
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', '& td, & th': { py: 1.5, px: 1, textAlign: 'left' } }}>
          <thead>
            <tr>
              <Typography component="th" variant="caption">Order</Typography>
              <Typography component="th" variant="caption">Name</Typography>
              <Typography component="th" variant="caption">Colour</Typography>
              <Typography component="th" variant="caption">Category</Typography>
              <Typography component="th" variant="caption">Default</Typography>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {stages.map((s, i) => (
              <tr key={s.id}>
                <td>
                  <IconButton
                    size="small"
                    aria-label={`Move ${s.name} earlier`}
                    disabled={busy || i === 0}
                    onClick={() => run(() => Axios.put(`${base}/order`, { ids: moveStageId(stages, s.id, -1) }))}
                  >
                    <Icon icon="bx:chevron-up" />
                  </IconButton>
                  <IconButton
                    size="small"
                    aria-label={`Move ${s.name} later`}
                    disabled={busy || i === stages.length - 1}
                    onClick={() => run(() => Axios.put(`${base}/order`, { ids: moveStageId(stages, s.id, 1) }))}
                  >
                    <Icon icon="bx:chevron-down" />
                  </IconButton>
                </td>
                <td>
                  <TextField
                    size="small"
                    value={names[s.id] ?? s.name}
                    inputProps={{ maxLength: 40, 'aria-label': `Name of ${s.name}` }}
                    onChange={(e) => setNames((n) => ({ ...n, [s.id]: e.target.value }))}
                    onBlur={() => saveName(s)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveName(s);
                    }}
                    disabled={busy}
                  />
                </td>
                <td>
                  <input
                    type="color"
                    aria-label={`Colour of ${s.name}`}
                    value={colors[s.id] ?? (s.color || '#8592A3')}
                    disabled={busy}
                    // The picker fires on every drag step: save once it closes.
                    onChange={(e) => setColors((c) => ({ ...c, [s.id]: e.target.value }))}
                    onBlur={() => {
                      const v = colors[s.id];
                      if (v && v.toUpperCase() !== (s.color || '').toUpperCase()) void update(s, { color: v });
                    }}
                    style={{ width: 36, height: 28, border: 'none', background: 'none', cursor: 'pointer' }}
                  />
                </td>
                <td>
                  <TextField
                    select
                    size="small"
                    value={s.category}
                    disabled={busy}
                    inputProps={{ 'aria-label': `Category of ${s.name}` }}
                    onChange={(e) => {
                      const c = String(e.target.value);
                      const err = categoryBlocker(stages, s.id, c);
                      if (err) toast.error(err);
                      else void update(s, { category: c });
                    }}
                    sx={{ minWidth: 140 }}
                  >
                    {CATEGORY_OPTIONS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </td>
                <td>
                  <Radio
                    checked={!!s.isDefault}
                    disabled={busy}
                    inputProps={{ 'aria-label': `Make ${s.name} the default` }}
                    onChange={() => {
                      if (s.category !== 'OPEN') toast.error('The default stage must be in the Open category.');
                      else void update(s, { isDefault: true });
                    }}
                  />
                </td>
                <td>
                  <Tooltip title={deleteBlocker(stages, s.id) || 'Delete'} arrow>
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        aria-label={`Delete ${s.name}`}
                        disabled={busy || !!deleteBlocker(stages, s.id)}
                        onClick={() => setRemoving({ id: s.id, moveTo: defaultMoveTarget(stages, s.id) || '' })}
                      >
                        <Icon icon="bx:trash" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </td>
              </tr>
            ))}
          </tbody>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 4, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            label="New stage"
            value={adding.name}
            inputProps={{ maxLength: 40 }}
            onChange={(e) => setAdding((a) => ({ ...a, name: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void add();
            }}
          />
          <input
            type="color"
            aria-label="Colour of the new stage"
            value={adding.color}
            onChange={(e) => setAdding((a) => ({ ...a, color: e.target.value }))}
            style={{ width: 36, height: 28, border: 'none', background: 'none', cursor: 'pointer' }}
          />
          <TextField
            select
            size="small"
            label="Category"
            value={adding.category}
            onChange={(e) => setAdding((a) => ({ ...a, category: String(e.target.value) }))}
            sx={{ minWidth: 140 }}
          >
            {CATEGORY_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" disabled={busy || !adding.name.trim()} onClick={() => void add()} startIcon={<Icon icon="bx:plus" />}>
            Add stage
          </Button>
        </Box>

        {removing && removingStage && (
          <Alert
            severity="warning"
            sx={{ mt: 4 }}
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button color="inherit" size="small" onClick={() => setRemoving(null)}>
                  Cancel
                </Button>
                <Button color="error" variant="contained" size="small" disabled={busy || !removing.moveTo} onClick={() => void confirmRemove()}>
                  Delete
                </Button>
              </Box>
            }
          >
            <Typography variant="body2" sx={{ mb: 2 }}>
              Delete &quot;{removingStage.name}&quot;? Its requests move to:
            </Typography>
            <TextField
              select
              size="small"
              value={removing.moveTo}
              onChange={(e) => setRemoving({ ...removing, moveTo: String(e.target.value) })}
              inputProps={{ 'aria-label': 'Move requests to' }}
              sx={{ minWidth: 200 }}
            >
              {stages
                .filter((s) => s.id !== removing.id)
                .map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
            </TextField>
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(changed)}>Done</Button>
      </DialogActions>
    </Dialog>
  );
};

export default StageManagerDialog;
