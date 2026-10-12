import { useCallback, useEffect, useMemo, useState } from 'react';
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
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import { toast } from 'react-hot-toast';

import ConsoleService, {
  apiError,
  OrgMeta,
  OverviewData,
  PlanData,
  startImpersonation,
} from 'src/services/console.service';
import CreateOrganizationDialog from 'src/views/super-admin/CreateOrganizationDialog';
import OrganizationDetailDialog from 'src/views/super-admin/OrganizationDetailDialog';

const StatCard = ({ label, value }: { label: string; value?: number }) => (
  <Card>
    <CardContent>
      <Typography variant="h4">{value ?? 0}</Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
    </CardContent>
  </Card>
);

const usageCell = (used?: number, max?: number) => (
  <Typography
    variant="body2"
    color={max !== undefined && (used ?? 0) >= max ? 'error.main' : undefined}
  >
    {used ?? 0} / {max ?? '-'}
  </Typography>
);

type Confirm = { title: string; body: string; run: () => Promise<void> } | null;

/**
 * Super Admin Console (Req 6). Operational metadata only — no conversation
 * content is ever shown here. Deep support access is via audit-logged,
 * short-lived impersonation ("Manage as").
 */
const SuperAdminConsole = () => {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [orgs, setOrgs] = useState<OrgMeta[]>([]);
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [featureKeys, setFeatureKeys] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOrg, setDetailOrg] = useState<OrgMeta | null>(null);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      ConsoleService.overview(),
      ConsoleService.listOrganizations(),
      ConsoleService.plans(),
      ConsoleService.features(),
    ])
      .then(([ov, orgList, planList, feats]) => {
        setOverview(ov);
        setOrgs(orgList);
        setPlans(planList);
        setFeatureKeys(feats);
      })
      .catch((err) => toast.error(apiError(err, 'Failed to load console')))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orgs.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (!q) return true;
      return [o.name, o.slug, o.plan, o.owner?.email, o.owner?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [orgs, search, statusFilter]);

  const runConfirmed = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await confirm.run();
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const askToggleSuspend = (org: OrgMeta) => {
    const next = org.status === 'suspended' ? 'active' : 'suspended';
    setConfirm({
      title: next === 'suspended' ? `Suspend ${org.name}?` : `Reactivate ${org.name}?`,
      body:
        next === 'suspended'
          ? 'All users of this organization will be blocked immediately (including active sessions). Data is preserved.'
          : 'Users of this organization will be able to sign in again.',
      run: async () => {
        try {
          await ConsoleService.updateOrganization(org.id, { status: next });
          toast.success(next === 'suspended' ? 'Organization suspended' : 'Organization reactivated');
          load();
        } catch (err: any) {
          toast.error(apiError(err, 'Failed to update status'));
        }
      },
    });
  };

  const askImpersonate = (org: OrgMeta) =>
    setConfirm({
      title: `Manage ${org.name}?`,
      body: 'You will act as this organization’s admin for up to 1 hour. This is recorded in the audit log. Use “Exit” in the banner to return to the console.',
      run: async () => {
        try {
          const { accessToken } = await ConsoleService.impersonate(org.id);
          startImpersonation(accessToken, { id: org.id, name: org.name });
        } catch (err: any) {
          toast.error(apiError(err, 'Failed to impersonate'));
        }
      },
    });

  const reconcile = async (org: OrgMeta) => {
    try {
      await ConsoleService.reconcile(org.id);
      toast.success('Usage counters recalculated');
      load();
    } catch (err: any) {
      toast.error(apiError(err, 'Failed to reconcile'));
    }
  };

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">Super Admin Console</Typography>
          <Button variant="contained" onClick={() => setCreateOpen(true)} disabled={!plans.length}>
            Create Organization
          </Button>
        </Box>
      </Grid>

      {overview && (
        <Grid item xs={12}>
          <Grid container spacing={4}>
            <Grid item xs={6} md={2}><StatCard label="Organizations" value={overview.organizations} /></Grid>
            <Grid item xs={6} md={2}><StatCard label="Org Admins" value={overview.orgAdmins} /></Grid>
            <Grid item xs={6} md={2}><StatCard label="Managers" value={overview.orgManagers} /></Grid>
            <Grid item xs={6} md={2}><StatCard label="Agents" value={overview.agents} /></Grid>
            <Grid item xs={6} md={2}><StatCard label="Bots" value={overview.bots} /></Grid>
            <Grid item xs={6} md={2}><StatCard label="Active Subs" value={overview.activeSubscriptions} /></Grid>
          </Grid>
        </Grid>
      )}

      <Grid item xs={12}>
        <Card>
          <CardHeader
            title="Organizations"
            action={
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  size="small"
                  placeholder="Search name, owner, plan"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  inputProps={{ 'aria-label': 'Search organizations' }}
                />
                <TextField
                  select
                  size="small"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  inputProps={{ 'aria-label': 'Filter by status' }}
                  sx={{ minWidth: 140 }}
                >
                  <MenuItem value="all">All statuses</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="suspended">Suspended</MenuItem>
                </TextField>
              </Box>
            }
          />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Bots</TableCell>
                    <TableCell>Agents</TableCell>
                    <TableCell>Channels</TableCell>
                    <TableCell>Managers</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Subscription</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visible.map((org) => (
                    <TableRow key={org.id} hover>
                      <TableCell>{org.name}</TableCell>
                      <TableCell>{org.owner?.email ?? '-'}</TableCell>
                      <TableCell>{org.plan ?? '-'}</TableCell>
                      <TableCell>{usageCell(org.usage?.bots, org.limits?.maxBots)}</TableCell>
                      <TableCell>{usageCell(org.usage?.agents, org.limits?.maxAgents)}</TableCell>
                      <TableCell>{usageCell(org.usage?.platforms, org.limits?.maxPlatforms)}</TableCell>
                      <TableCell>{org.counts?.orgManagers ?? 0}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={org.status}
                          color={org.status === 'active' ? 'success' : 'warning'}
                        />
                      </TableCell>
                      <TableCell>{org.subscriptionStatus ?? '-'}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          <Button size="small" onClick={() => setDetailOrg(org)}>
                            Edit
                          </Button>
                          <Button size="small" onClick={() => reconcile(org)}>
                            Recount
                          </Button>
                          <Button
                            size="small"
                            color={org.status === 'suspended' ? 'success' : 'warning'}
                            onClick={() => askToggleSuspend(org)}
                          >
                            {org.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={org.status === 'suspended'}
                            onClick={() => askImpersonate(org)}
                          >
                            Manage as
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && visible.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        {orgs.length
                          ? 'No organizations match your filters.'
                          : 'No organizations yet. Create one to get started.'}
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
        featureKeys={featureKeys}
      />
      <OrganizationDetailDialog
        org={detailOrg}
        plans={plans}
        featureKeys={featureKeys}
        onClose={() => setDetailOrg(null)}
        onSaved={load}
      />
      <Dialog open={!!confirm} onClose={() => !busy && setConfirm(null)}>
        <DialogTitle>{confirm?.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirm?.body}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button color="secondary" onClick={() => setConfirm(null)} disabled={busy}>
            Cancel
          </Button>
          <Button variant="contained" onClick={runConfirmed} disabled={busy}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default SuperAdminConsole;
