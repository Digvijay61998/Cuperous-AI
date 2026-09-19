import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { toast } from 'react-hot-toast';
import ConsoleService, { PlanData } from 'src/services/console.service';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  plans: PlanData[];
}

const empty = {
  name: '',
  ownerName: '',
  ownerEmail: '',
  ownerPassword: '',
  planId: '',
  maxBots: '' as string | number,
};

const CreateOrganizationDialog = ({
  open,
  onClose,
  onCreated,
  plans,
}: Props) => {
  const [form, setForm] = useState({ ...empty });
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof empty, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const reset = () => setForm({ ...empty });

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!form.name || !form.ownerEmail || !form.ownerPassword || !form.planId) {
      toast.error('Name, owner email/password and plan are required');
      return;
    }
    setSaving(true);
    try {
      await ConsoleService.createOrganization({
        name: form.name,
        owner: {
          name: form.ownerName || form.ownerEmail,
          email: form.ownerEmail,
          password: form.ownerPassword,
        },
        planId: form.planId,
        limits:
          form.maxBots !== '' ? { maxBots: Number(form.maxBots) } : undefined,
      });
      toast.success('Organization created');
      reset();
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || 'Failed to create',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Organization</DialogTitle>
      <DialogContent>
        <Grid container spacing={4} sx={{ mt: 0 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Organization name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Organization owner (ORG_ADMIN)
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              label="Owner name"
              value={form.ownerName}
              onChange={(e) => set('ownerName', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              type="email"
              label="Owner email"
              value={form.ownerEmail}
              onChange={(e) => set('ownerEmail', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              type="password"
              label="Owner password"
              value={form.ownerPassword}
              onChange={(e) => set('ownerPassword', e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              fullWidth
              size="small"
              label="Plan"
              value={form.planId}
              onChange={(e) => set('planId', e.target.value)}
            >
              {plans.map((p) => (
                <MenuItem key={p._id} value={p._id}>
                  {p.name} (bots {p.limits?.maxBots})
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Max bots override (optional)"
              value={form.maxBots}
              onChange={(e) => set('maxBots', e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button color="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Creating…' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateOrganizationDialog;
