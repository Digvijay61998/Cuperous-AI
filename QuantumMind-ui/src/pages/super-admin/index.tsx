import { useCallback, useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import { toast } from 'react-hot-toast';

import ConsoleService, {
  OrgMeta,
  OverviewData,
  PlanData,
} from 'src/services/console.service';
import CreateOrganizationDialog from 'src/views/super-admin/CreateOrganizationDialog';

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <Card>
    <CardContent>
      <Typography variant="h4">{value ?? 0}</Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </CardContent>
  </Card>
);

// Inline dialog to edit an org's bot limit (persisted as a subscription override).
const EditLimitsDialog = ({
  org,
  onClose,
  onSaved,
}: {
  org: OrgMeta | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [maxBots, setMaxBots] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMaxBots(org?.limits ? String(org.limits.maxBots) : '');
  }, [org]);

  if (!org) return null;

  const save = async () => {
    setSaving(true);
    try {
      await ConsoleService.updateOrganization(org.id, {
        limits: { maxBots: Number(maxBots) },
      });
      toast.success('Limits updated');
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!org} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Edit limits — {org.name}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          size="small"
          type="number"
          label="Max bots"
          sx={{ mt: 2 }}
          value={maxBots}
          onChange={(e) => setMaxBots(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={save} disabled={saving}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const SuperAdminConsole = () => {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [orgs, setOrgs] = useState<OrgMeta[]>([]);
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOrg, setEditOrg] = useState<OrgMeta | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      ConsoleService.overview(),
      ConsoleService.listOrganizations(),
      ConsoleService.plans(),
    ])
      .then(([ov, orgList, planList]) => {
        setOverview(ov);
        setOrgs(orgList);
        setPlans(planList);
      })
      .catch((err) =>
        toast.error(err?.response?.data?.message || 'Failed to load console'),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSuspend = async (org: OrgMeta) => {
    const next = org.status === 'suspended' ? 'active' : 'suspended';
    try {
      await ConsoleService.updateOrganization(org.id, { status: next });
      toast.success(next === 'suspended' ? 'Organization suspended' : 'Organization reactivated');
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    }
  };

  const impersonate = async (org: OrgMeta) => {
    try {
      const { accessToken } = await ConsoleService.impersonate(org.id);
      // Swap the session to the org context and open its dashboard.
      window.localStorage.setItem('accessToken', accessToken);
      window.localStorage.removeItem('userData');
      window.location.href = '/';
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to impersonate');
    }
  };

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h5">Super Admin Console</Typography>
          <Button variant="contained" onClick={() => setCreateOpen(true)}>
            Create Organization
          </Button>
        </Box>
      </Grid>

      {overview && (
        <Grid item xs={12}>
          <Grid container spacing={4}>
            <Grid item xs={6} md={2}>
              <StatCard label="Organizations" value={overview.organizations} />
            </Grid>
            <Grid item xs={6} md={2}>
              <StatCard label="Org Admins" value={overview.orgAdmins} />
            </Grid>
            <Grid item xs={6} md={2}>
              <StatCard label="Managers" value={overview.orgManagers} />
            </Grid>
            <Grid item xs={6} md={2}>
              <StatCard label="Agents" value={overview.agents} />
            </Grid>
            <Grid item xs={6} md={2}>
              <StatCard label="Bots" value={overview.bots} />
            </Grid>
            <Grid item xs={6} md={2}>
              <StatCard
                label="Active Subs"
                value={overview.activeSubscriptions}
              />
            </Grid>
          </Grid>
        </Grid>
      )}

      <Grid item xs={12}>
        <Card>
          <CardHeader title="Organizations" />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Bots</TableCell>
                    <TableCell>Agents</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Subscription</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orgs.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>{org.name}</TableCell>
                      <TableCell>{org.plan ?? '-'}</TableCell>
                      <TableCell>
                        {org.usage.bots} / {org.limits?.maxBots ?? '-'}
                      </TableCell>
                      <TableCell>
                        {org.usage.agents} / {org.limits?.maxAgents ?? '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={org.status}
                          color={
                            org.status === 'active' ? 'success' : 'warning'
                          }
                        />
                      </TableCell>
                      <TableCell>{org.subscriptionStatus ?? '-'}</TableCell>
                      <TableCell align="right">
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 1,
                            justifyContent: 'flex-end',
                            flexWrap: 'wrap',
                          }}
                        >
                          <Button size="small" onClick={() => setEditOrg(org)}>
                            Limits
                          </Button>
                          <Button
                            size="small"
                            color={
                              org.status === 'suspended' ? 'success' : 'warning'
                            }
                            onClick={() => toggleSuspend(org)}
                          >
                            {org.status === 'suspended'
                              ? 'Reactivate'
                              : 'Suspend'}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => impersonate(org)}
                          >
                            Manage as
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && orgs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        No organizations yet. Create one to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      <CreateOrganizationDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={load}
        plans={plans}
      />
      <EditLimitsDialog
        org={editOrg}
        onClose={() => setEditOrg(null)}
        onSaved={load}
      />
    </Grid>
  );
};

export default SuperAdminConsole;
