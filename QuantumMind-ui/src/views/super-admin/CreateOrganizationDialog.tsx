import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import { toast } from 'react-hot-toast';
import ConsoleService, {
  apiError,
  LIMIT_FIELDS,
  OrgLimits,
  PlanData,
} from 'src/services/console.service';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  plans: PlanData[];
  featureKeys: string[];
}

type LimitForm = Record<keyof OrgLimits, string>;

const emptyLimits: LimitForm = {
  maxBots: '',
  maxAgents: '',
  maxPlatforms: '',
  maxTemplates: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * One flow (Req 6.1): organization + its ORG_ADMIN owner + plan + editable
 * limits + feature toggles. Limits/features start from the selected plan; only
 * values that differ from the plan are sent, as subscription overrides.
 */
const CreateOrganizationDialog = ({
  open,
  onClose,
  onCreated,
  plans,
  featureKeys,
}: Props) => {
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [planId, setPlanId] = useState('');
  const [limits, setLimits] = useState<LimitForm>({ ...emptyLimits });
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const plan = plans.find((p) => p._id === planId);

  // Selecting a plan pre-fills its defaults so the operator edits from there.
  useEffect(() => {
    if (!plan) return;
    setLimits({
      maxBots: String(plan.limits?.maxBots ?? ''),
      maxAgents: String(plan.limits?.maxAgents ?? ''),
      maxPlatforms: String(plan.limits?.maxPlatforms ?? ''),
      maxTemplates: String(plan.limits?.maxTemplates ?? ''),
    });
    const f: Record<string, boolean> = {};
    for (const k of featureKeys) f[k] = !!plan.features?.[k];
    setFeatures(f);
  }, [planId]); // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => {
    setName('');
    setOwnerName('');
    setOwnerEmail('');
    setOwnerPassword('');
    setPlanId('');
    setLimits({ ...emptyLimits });
    setFeatures({});
  };

  const handleClose = () => {
    if (saving) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error('Organization name is required');
    if (!EMAIL_RE.test(ownerEmail.trim())) return toast.error('A valid owner email is required');
    if (ownerPassword.length < 8) return toast.error('Owner password must be at least 8 characters');
    if (!plan) return toast.error('Select a plan');

    const limitOverrides: Partial<OrgLimits> = {};
    for (const { key, label } of LIMIT_FIELDS) {
      if (limits[key] === '') continue;
      const n = Number(limits[key]);
      if (!Number.isInteger(n) || n < 0) {
        return toast.error(`${label} must be a whole number ≥ 0`);
      }
      if (n !== plan.limits?.[key]) limitOverrides[key] = n;
    }
    const featureOverrides: Record<string, boolean> = {};
    for (const k of featureKeys) {
      if (!!features[k] !== !!plan.features?.[k]) featureOverrides[k] = !!features[k];
    }

    setSaving(true);
    try {
      await ConsoleService.createOrganization({
        name: name.trim(),
        owner: {
          name: ownerName.trim() || ownerEmail.trim(),
          email: ownerEmail.trim().toLowerCase(),
          password: ownerPassword,
        },
        planId,
        limits: Object.keys(limitOverrides).length ? limitOverrides : undefined,
        features: Object.keys(featureOverrides).length ? featureOverrides : undefined,
      });
      toast.success('Organization created');
      reset();
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(apiError(err, 'Failed to create'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>Create Organization</DialogTitle>
      <DialogContent>
        <Grid container spacing={4} sx={{ mt: 0 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              required
              label="Organization name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2">Organization owner (Org Admin)</Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" label="Owner name" value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" required type="email" label="Owner email"
              value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth size="small" required type="password" label="Owner password"
              helperText="At least 8 characters" value={ownerPassword}
              autoComplete="new-password"
              onChange={(e) => setOwnerPassword(e.target.value)} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField select fullWidth size="small" required label="Plan" value={planId}
              onChange={(e) => setPlanId(e.target.value)}>
              {plans.map((p) => (
                <MenuItem key={p._id} value={p._id}>
                  {p.name} (bots {p.limits?.maxBots}, agents {p.limits?.maxAgents})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {plan && (
            <>
              <Grid item xs={12}>
                <Divider />
                <Typography variant="subtitle2" sx={{ mt: 3 }}>
                  Limits (pre-filled from the plan; changes apply to this organization only)
                </Typography>
              </Grid>
              {LIMIT_FIELDS.map(({ key, label }) => (
                <Grid item xs={12} sm={6} md={3} key={key}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    inputProps={{ min: 0, step: 1 }}
                    label={label}
                    value={limits[key]}
                    onChange={(e) => setLimits((l) => ({ ...l, [key]: e.target.value }))}
                  />
                </Grid>
              ))}
              <Grid item xs={12}>
                <Divider />
                <Typography variant="subtitle2" sx={{ mt: 3 }}>Features</Typography>
              </Grid>
              {featureKeys.map((k) => (
                <Grid item xs={12} sm={6} md={4} key={k}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!features[k]}
                        onChange={(e) => setFeatures((f) => ({ ...f, [k]: e.target.checked }))}
                      />
                    }
                    label={k}
                  />
                </Grid>
              ))}
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button color="secondary" onClick={handleClose} disabled={saving}>
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
