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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { toast } from 'react-hot-toast';
import ConsoleService, {
  apiError,
  AuditLogRow,
  LIMIT_FIELDS,
  OrgLimits,
  OrgMeta,
  PlanData,
} from 'src/services/console.service';

interface Props {
  org: OrgMeta | null;
  plans: PlanData[];
  featureKeys: string[];
  onClose: () => void;
  onSaved: () => void;
}

const SUBSCRIPTION_STATUSES = ['active', 'trialing', 'past_due', 'canceled'];

/**
 * Organization detail: rename, change plan / subscription status, edit limits
 * and feature toggles. Limits and features are persisted as SUBSCRIPTION
 * OVERRIDES (the shared plan is never changed). Also shows the org's audit log.
 */
const OrganizationDetailDialog = ({
  org,
  plans,
  featureKeys,
  onClose,
  onSaved,
}: Props) => {
  const [tab, setTab] = useState(0);
  const [name, setName] = useState('');
  const [planId, setPlanId] = useState('');
  const [subStatus, setSubStatus] = useState('');
  const [limits, setLimits] = useState<Record<keyof OrgLimits, string>>({
    maxBots: '',
    maxAgents: '',
    maxPlatforms: '',
    maxTemplates: '',
  });
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<AuditLogRow[]>([]);

  useEffect(() => {
    if (!org) return;
    setTab(0);
    setName(org.name);
    setPlanId(org.planId || '');
    setSubStatus(org.subscriptionStatus || '');
    setLimits({
      maxBots: String(org.limits?.maxBots ?? ''),
      maxAgents: String(org.limits?.maxAgents ?? ''),
      maxPlatforms: String(org.limits?.maxPlatforms ?? ''),
      maxTemplates: String(org.limits?.maxTemplates ?? ''),
    });
    setFeatures({ ...(org.features || {}) });
    ConsoleService.auditLogs({ organizationId: org.id, limit: 50 })
      .then((r) => setLogs(r.data))
      .catch(() => setLogs([]));
  }, [org]);

  if (!org) return null;

  const save = async () => {
    const changedLimits: Partial<OrgLimits> = {};
    for (const { key, label } of LIMIT_FIELDS) {
      const raw = limits[key];
      if (raw === '') continue;
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 0) {
        toast.error(`${label} must be a whole number ≥ 0`);
        return;
      }
      if (n !== org.limits?.[key]) changedLimits[key] = n;
    }
    const changedFeatures: Record<string, boolean> = {};
    for (const k of featureKeys) {
      if (!!features[k] !== !!org.features?.[k]) changedFeatures[k] = !!features[k];
    }

    const payload: any = {};
    if (name.trim() && name.trim() !== org.name) payload.name = name.trim();
    if (planId && planId !== org.planId) payload.planId = planId;
    if (subStatus && subStatus !== org.subscriptionStatus)
      payload.subscriptionStatus = subStatus;
    if (Object.keys(changedLimits).length) payload.limits = changedLimits;
    if (Object.keys(changedFeatures).length) payload.features = changedFeatures;

    if (!Object.keys(payload).length) {
      onClose();
      return;
    }

    // Warn (don't block) when a limit is set below current usage: existing
    // resources stay, but new creates are blocked (Req 3.8).
    const usageKey: Record<keyof OrgLimits, keyof OrgMeta['usage']> = {
      maxBots: 'bots',
      maxAgents: 'agents',
      maxPlatforms: 'platforms',
      maxTemplates: 'templates',
    };
    for (const [k, v] of Object.entries(changedLimits) as [keyof OrgLimits, number][]) {
      const used = org.usage?.[usageKey[k]] ?? 0;
      if (v < used) {
        toast(`Note: ${k} (${v}) is below current usage (${used}). Existing items are kept; new ones will be blocked.`);
      }
    }

    setSaving(true);
    try {
      await ConsoleService.updateOrganization(org.id, payload);
      toast.success('Organization updated');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(apiError(err, 'Failed to update'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!org} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{org.name}</DialogTitle>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 5 }}>
        <Tab label="Settings" />
        <Tab label="Audit log" />
      </Tabs>
      <DialogContent>
        {tab === 0 && (
          <Grid container spacing={4} sx={{ mt: 0 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                size="small"
                label="Organization name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Owner: {org.owner ? `${org.owner.name} (${org.owner.email})` : '-'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Slug: {org.slug}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Plan"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
              >
                {plans.map((p) => (
                  <MenuItem key={p._id} value={p._id}>
                    {p.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                size="small"
                label="Subscription status"
                value={subStatus}
                onChange={(e) => setSubStatus(e.target.value)}
              >
                {SUBSCRIPTION_STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Divider />
              <Typography variant="subtitle2" sx={{ mt: 3 }}>
                Limits (saved as overrides for this organization only)
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
                  helperText={`Used: ${
                    org.usage?.[
                      ({
                        maxBots: 'bots',
                        maxAgents: 'agents',
                        maxPlatforms: 'platforms',
                        maxTemplates: 'templates',
                      } as const)[key]
                    ] ?? 0
                  }`}
                  onChange={(e) =>
                    setLimits((l) => ({ ...l, [key]: e.target.value }))
                  }
                />
              </Grid>
            ))}

            <Grid item xs={12}>
              <Divider />
              <Typography variant="subtitle2" sx={{ mt: 3 }}>
                Features
              </Typography>
            </Grid>
            {featureKeys.map((k) => (
              <Grid item xs={12} sm={6} md={4} key={k}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!!features[k]}
                      onChange={(e) =>
                        setFeatures((f) => ({ ...f, [k]: e.target.checked }))
                      }
                    />
                  }
                  label={k}
                />
              </Grid>
            ))}
          </Grid>
        )}

        {tab === 1 && (
          <Table size="small" sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>When</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.map((l) => (
                <TableRow key={l._id}>
                  <TableCell>{new Date(l.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{l.action}</TableCell>
                  <TableCell>{l.actorRole}</TableCell>
                  <TableCell sx={{ maxWidth: 360, wordBreak: 'break-word' }}>
                    <code style={{ fontSize: 11 }}>
                      {JSON.stringify(l.metadata)}
                    </code>
                  </TableCell>
                </TableRow>
              ))}
              {!logs.length && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No audit entries yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </DialogContent>
      <DialogActions>
        <Button color="secondary" onClick={onClose}>
          Close
        </Button>
        {tab === 0 && (
          <Button variant="contained" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default OrganizationDetailDialog;
