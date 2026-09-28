// ** React Imports
import { useEffect, useState } from 'react';

// ** Next Imports
import { useRouter } from 'next/router';

// ** MUI Imports
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
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
import { fetchCompanyById } from 'src/store/apps/crm';

// ** Components
import ActivityTimeline from 'src/views/crm/ActivityTimeline';
import CustomFieldsPanel from 'src/views/crm/CustomFieldsPanel';
import CompanyDrawer from 'src/views/crm/CompanyDrawer';

// ** Utils
import { humanize, initials } from 'src/views/crm/utils';

const CompanyDetail = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const id = router.query.companyId as string;

  const record = useSelector((state: RootState) => state.crm.selectedRecord);
  const loading = useSelector((state: RootState) => state.crm.loadingDetail);

  const [tab, setTab] = useState<string>('overview');
  const [editOpen, setEditOpen] = useState<boolean>(false);

  useEffect(() => {
    if (id) dispatch(fetchCompanyById(id));
  }, [dispatch, id]);

  const closeEdit = () => {
    setEditOpen(false);
    if (id) dispatch(fetchCompanyById(id));
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
            onClick={() => router.push('/crm/companies')}
            startIcon={<Icon icon="bx:arrow-back" />}
          >
            Back to Companies
          </Button>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CustomAvatar
                skin="light"
                color="info"
                variant="rounded"
                src={record.logoUrl || undefined}
                sx={{ width: 72, height: 72, mx: 'auto', mb: 3, fontSize: '1.5rem' }}
              >
                {initials(record.name)}
              </CustomAvatar>
              <Typography variant="h6">{record.name}</Typography>
              {record.domain && (
                <Typography variant="body2" color="text.secondary">
                  {record.domain}
                </Typography>
              )}
              <Button
                variant="contained"
                size="small"
                sx={{ mt: 4 }}
                onClick={() => setEditOpen(true)}
                startIcon={<Icon icon="bx:pencil" />}
              >
                Edit
              </Button>

              <Box sx={{ mt: 5, textAlign: 'left' }}>
                <DetailRow icon="bx:category" label="Industry" value={humanize(record.industry)} />
                <DetailRow
                  icon="bx:map"
                  label="Location"
                  value={[record.city, record.country].filter(Boolean).join(', ')}
                />
                <DetailRow icon="bx:envelope" label="Email" value={record.email} />
                <DetailRow icon="bx:phone" label="Phone" value={record.phone} />
                <DetailRow icon="bx:globe" label="Website" value={record.website} />
              </Box>
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
                  <Box sx={{ display: 'flex', gap: 6 }}>
                    <Stat label="Contacts" value={record._count?.contacts ?? 0} />
                    <Stat label="Deals" value={record._count?.deals ?? 0} />
                  </Box>
                  {record.primaryContact && (
                    <Box sx={{ mt: 4 }}>
                      <Typography variant="caption" color="text.disabled">
                        Primary contact
                      </Typography>
                      <Typography variant="body2">
                        {[record.primaryContact.firstName, record.primaryContact.lastName]
                          .filter(Boolean)
                          .join(' ')}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
              {tab === 'activity' && <ActivityTimeline scope={{ companyId: id }} />}
              {tab === 'fields' && <CustomFieldsPanel entity="COMPANY" recordId={id} />}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <CompanyDrawer open={editOpen} toggle={closeEdit} company={record} />
    </>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <Box>
    <Typography variant="h6">{value}</Typography>
    <Typography variant="caption" color="text.disabled">
      {label}
    </Typography>
  </Box>
);

const DetailRow = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value?: string | null;
}) => {
  if (!value) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      <Icon icon={icon} fontSize={18} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
};

export default CompanyDetail;
