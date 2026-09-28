// ** React Imports
import { useEffect, useState } from 'react';

// ** Next Imports
import { useRouter } from 'next/router';
import Link from 'next/link';

// ** MUI Imports
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Custom Components
import CustomAvatar from 'src/@core/components/mui/avatar';

// ** Store & Actions
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import { fetchDealById, updateDealStage } from 'src/store/apps/crm';

// ** Components
import ActivityTimeline from 'src/views/crm/ActivityTimeline';
import CustomFieldsPanel from 'src/views/crm/CustomFieldsPanel';
import DealDrawer from 'src/views/crm/DealDrawer';

// ** Utils
import { DEAL_STAGES, formatCurrency, humanize, initials } from 'src/views/crm/utils';

const DealDetail = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const id = router.query.dealId as string;

  const record = useSelector((state: RootState) => state.crm.selectedRecord);
  const loading = useSelector((state: RootState) => state.crm.loadingDetail);

  const [tab, setTab] = useState<string>('overview');
  const [editOpen, setEditOpen] = useState<boolean>(false);

  useEffect(() => {
    if (id) dispatch(fetchDealById(id));
  }, [dispatch, id]);

  const closeEdit = () => {
    setEditOpen(false);
    if (id) dispatch(fetchDealById(id));
  };

  const handleStageChange = async (stage: string) => {
    await dispatch(updateDealStage({ id, data: { stage } }));
    dispatch(fetchDealById(id));
  };

  if (loading || !record || record.id !== id) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Button
            size="small"
            variant="text"
            onClick={() => router.push('/crm/deals')}
            startIcon={<Icon icon="bx:arrow-back" />}
          >
            Back to Deals
          </Button>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px' }}>
            <CardContent>
              <Typography variant="h6">{record.name}</Typography>
              {record.company && (
                <Link href={`/crm/companies/${record.company.id}`} passHref>
                  <Typography variant="body2" sx={{ color: 'primary.main', cursor: 'pointer' }}>
                    {record.company.name}
                  </Typography>
                </Link>
              )}
              <Typography variant="h5" sx={{ mt: 3 }}>
                {formatCurrency(record.amount, record.currency || 'USD')}
              </Typography>

              <FormControl fullWidth size="small" sx={{ mt: 4 }}>
                <InputLabel id="deal-stage-detail">Stage</InputLabel>
                <Select
                  labelId="deal-stage-detail"
                  label="Stage"
                  value={record.stage}
                  onChange={(e) => handleStageChange(e.target.value)}
                >
                  {DEAL_STAGES.map((s) => (
                    <MenuItem key={s} value={s}>
                      {humanize(s)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                size="small"
                sx={{ mt: 4 }}
                onClick={() => setEditOpen(true)}
                startIcon={<Icon icon="bx:pencil" />}
              >
                Edit
              </Button>

              {record.expectedCloseDate && (
                <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 4 }}>
                  Expected close: {new Date(record.expectedCloseDate).toLocaleDateString()}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card sx={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px' }}>
            <Tabs
              value={tab}
              onChange={(_e, v) => setTab(v)}
              sx={{ borderBottom: (t) => `1px solid ${t.palette.divider}`, px: 2 }}
            >
              <Tab value="overview" label="Overview" />
              <Tab value="activity" label="Activity" />
              <Tab value="fields" label="Custom Fields" />
            </Tabs>
            <CardContent>
              {tab === 'overview' && (
                <Box>
                  {record.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                      {record.description}
                    </Typography>
                  )}
                  <Typography variant="subtitle2" sx={{ mb: 3 }}>
                    Contacts
                  </Typography>
                  {record.contacts?.length ? (
                    record.contacts.map((c: any) => {
                      const cname =
                        [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email;
                      return (
                        <Box
                          key={c.id}
                          sx={{ display: 'flex', alignItems: 'center', gap: 3, py: 2 }}
                        >
                          <CustomAvatar
                            skin="light"
                            color="primary"
                            src={c.imageUrl || undefined}
                            sx={{ width: 32, height: 32, fontSize: '0.8rem' }}
                          >
                            {initials(cname)}
                          </CustomAvatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {cname}
                            </Typography>
                            {c.role && (
                              <Typography variant="caption" color="text.disabled">
                                {c.role}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      );
                    })
                  ) : (
                    <Typography variant="body2" color="text.disabled">
                      No contacts linked to this deal.
                    </Typography>
                  )}
                </Box>
              )}
              {tab === 'activity' && <ActivityTimeline scope={{ dealId: id }} />}
              {tab === 'fields' && <CustomFieldsPanel entity="DEAL" recordId={id} />}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <DealDrawer open={editOpen} toggle={closeEdit} deal={record} />
    </>
  );
};

export default DealDetail;
