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
import Grid from '@mui/material/Grid';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Custom Components
import CustomAvatar from 'src/@core/components/mui/avatar';
import CustomChip from 'src/@core/components/mui/chip';

// ** Store & Actions
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import { enrichContact, fetchContactById } from 'src/store/apps/crm';

// ** Components
import ActivityTimeline from 'src/views/crm/ActivityTimeline';
import CustomFieldsPanel from 'src/views/crm/CustomFieldsPanel';
import ContactDrawer from 'src/views/crm/ContactDrawer';
import ContactFactsPanel from 'src/views/crm/ContactFactsPanel';

// ** Utils
import { formatCurrency, humanize, initials, stageColor } from 'src/views/crm/utils';

const ContactDetail = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const id = router.query.contactId as string;

  const record = useSelector((state: RootState) => state.crm.selectedRecord);
  const loading = useSelector((state: RootState) => state.crm.loadingDetail);

  const [tab, setTab] = useState<string>('overview');
  const [editOpen, setEditOpen] = useState<boolean>(false);

  useEffect(() => {
    if (id) dispatch(fetchContactById(id));
  }, [dispatch, id]);

  const closeEdit = () => {
    setEditOpen(false);
    if (id) dispatch(fetchContactById(id));
  };

  if (loading || !record || record.id !== id) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  const name = [record.firstName, record.lastName].filter(Boolean).join(' ') || '—';

  const suggestionCount = (record.facts || []).filter((f: any) => f.status === 'PROPOSED').length;
  const factsTabLabel = suggestionCount > 0 ? `Facts (${suggestionCount})` : 'Facts';

  return (
    <>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Button
            size="small"
            variant="text"
            onClick={() => router.push('/crm/contacts')}
            startIcon={<Icon icon="bx:arrow-back" />}
          >
            Back to Contacts
          </Button>
        </Grid>

        {/* Header */}
        <Grid item xs={12} md={4}>
          <Card sx={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CustomAvatar
                skin="light"
                color="primary"
                src={record.imageUrl || undefined}
                sx={{ width: 72, height: 72, mx: 'auto', mb: 3, fontSize: '1.5rem' }}
              >
                {initials(name)}
              </CustomAvatar>
              <Typography variant="h6">{name}</Typography>
              {record.title && (
                <Typography variant="body2" color="text.secondary">
                  {record.title}
                </Typography>
              )}
              <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => setEditOpen(true)}
                  startIcon={<Icon icon="bx:pencil" />}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={record.enrichmentStatus === 'PENDING' || record.enrichmentStatus === 'RUNNING'}
                  onClick={() => dispatch(enrichContact(id))}
                  startIcon={<Icon icon="bx:bot" />}
                >
                  {record.enrichmentStatus === 'PENDING' || record.enrichmentStatus === 'RUNNING'
                    ? 'Queued'
                    : 'Enrich'}
                </Button>
              </Box>

              <Box sx={{ mt: 5, textAlign: 'left' }}>
                <DetailRow icon="bx:envelope" label="Email" value={record.email} />
                <DetailRow icon="bx:phone" label="Phone" value={record.phone} />
                <DetailRow
                  icon="bx:buildings"
                  label="Company"
                  value={record.company?.name}
                  href={record.company ? `/crm/companies/${record.company.id}` : undefined}
                />
                <DetailRow icon="bx:briefcase" label="Function" value={humanize(record.function)} />
                <DetailRow icon="bx:link" label="LinkedIn" value={record.linkedinUrl} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Tabs */}
        <Grid item xs={12} md={8}>
          <Card sx={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px' }}>
            <Tabs
              value={tab}
              onChange={(_e, v) => setTab(v)}
              sx={{ borderBottom: (t) => `1px solid ${t.palette.divider}`, px: 2 }}
            >
              <Tab value="overview" label="Overview" />
              <Tab value="facts" label={factsTabLabel} />
              <Tab value="activity" label="Activity" />
              <Tab value="fields" label="Custom Fields" />
            </Tabs>
            <CardContent>
              {tab === 'overview' && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 3 }}>
                    Deals
                  </Typography>
                  {record.deals?.length ? (
                    record.deals.map((d: any) => (
                      <Box
                        key={d.id}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          py: 2,
                          borderBottom: (t) => `1px solid ${t.palette.divider}`,
                        }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {d.name}
                          </Typography>
                          <CustomChip
                            rounded
                            skin="light"
                            size="small"
                            label={humanize(d.stage)}
                            color={stageColor(d.stage)}
                          />
                        </Box>
                        <Typography variant="body2">
                          {formatCurrency(d.amount, d.currency || 'USD')}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.disabled">
                      No deals linked to this contact.
                    </Typography>
                  )}
                </Box>
              )}
              {tab === 'facts' && <ContactFactsPanel facts={record.facts || []} contactId={id} />}
              {tab === 'activity' && <ActivityTimeline scope={{ contactId: id }} />}
              {tab === 'fields' && <CustomFieldsPanel entity="CONTACT" recordId={id} />}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <ContactDrawer open={editOpen} toggle={closeEdit} contact={record} />
    </>
  );
};

const DetailRow = ({
  icon,
  label,
  value,
  href,
}: {
  icon: string;
  label: string;
  value?: string | null;
  href?: string;
}) => {
  if (!value) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      <Icon icon={icon} fontSize={18} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
          {label}
        </Typography>
        {href ? (
          <Link href={href} passHref>
            <Typography
              variant="body2"
              sx={{ color: 'primary.main', cursor: 'pointer', wordBreak: 'break-word' }}
            >
              {value}
            </Typography>
          </Link>
        ) : (
          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
            {value}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default ContactDetail;
