// ** React Imports
import { useCallback, useEffect, useMemo, useState } from 'react';

// ** Next Import
import { useRouter } from 'next/router';

// ** MUI Imports
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

// ** Store & Actions
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import { fetchDeals } from 'src/store/apps/crm';

// ** Components
import CustomChip from 'src/@core/components/mui/chip';
import CrmEmptyState from 'src/views/crm/CrmEmptyState';
import CrmTableHeader from 'src/views/crm/CrmTableHeader';
import DealDrawer from 'src/views/crm/DealDrawer';
import SavedViewsBar from 'src/views/crm/SavedViewsBar';

// ** Utils
import {
  DEAL_STAGES,
  formatCurrency,
  humanize,
  stageColor,
} from 'src/views/crm/utils';

const CrmDeals = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { data } = useSelector((state: RootState) => state.crm.deals);
  const loading = useSelector((state: RootState) => state.crm.loadingDeals);

  const [value, setValue] = useState<string>('');
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<any>(null);

  const handleFilter = useCallback((val: string) => {
    setValue(val);
  }, []);

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const toggleDrawer = () => setDrawerOpen((o) => !o);

  useEffect(() => {
    dispatch(fetchDeals({ q: value, pageSize: 100 }));
  }, [dispatch, value]);

  // Group deals into their pipeline stages.
  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    DEAL_STAGES.forEach((stage) => {
      map[stage] = [];
    });
    (data || []).forEach((deal: any) => {
      const stage = deal?.stage && map[deal.stage] ? deal.stage : DEAL_STAGES[0];
      map[stage].push(deal);
    });
    return map;
  }, [data]);

  const hasData = (data?.length || 0) > 0;

  const stageTotal = (deals: any[]) =>
    deals.reduce((sum, d) => sum + Number(d?.amount || 0), 0);

  return (
    <>
      <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card
          sx={{
            boxShadow:
              'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px',
          }}
        >
          <CrmTableHeader
            title="Deals"
            searchPlaceholder="Search deals"
            addLabel="Add Deal"
            handleFilter={handleFilter}
            toggle={openCreate}
          />
          <Divider sx={{ m: '0 !important' }} />
          <SavedViewsBar
            entity="DEAL"
            currentFilters={{ q: value }}
            onApply={(f) => setValue(f?.q || '')}
          />
          <Divider sx={{ m: '0 !important' }} />

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && !hasData && (
            <CrmEmptyState
              icon="bx:trending-up"
              title="No deals yet"
              subtitle="Create your first deal to start your pipeline."
              actionLabel="Add Deal"
              onAction={openCreate}
            />
          )}

          {!loading && hasData && (
            <Box
              sx={{
                p: 6,
                gap: 4,
                display: 'flex',
                overflowX: 'auto',
                alignItems: 'flex-start',
              }}
            >
              {DEAL_STAGES.map((stage) => {
                const deals = grouped[stage] || [];

                return (
                  <Box
                    key={stage}
                    sx={{
                      minWidth: 280,
                      maxWidth: 280,
                      flexShrink: 0,
                      backgroundColor: 'action.hover',
                      borderRadius: 1,
                      p: 3,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 3,
                      }}
                    >
                      <CustomChip
                        rounded
                        skin="light"
                        size="small"
                        label={humanize(stage)}
                        color={stageColor(stage)}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {deals.length}
                      </Typography>
                    </Box>

                    <Typography
                      variant="caption"
                      color="text.disabled"
                      sx={{ display: 'block', mb: 2 }}
                    >
                      {formatCurrency(stageTotal(deals))}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {deals.map((deal: any) => (
                        <Card
                          key={deal?._id || deal?.id}
                          onClick={() => router.push(`/crm/deals/${deal?._id || deal?.id}`)}
                          sx={{
                            boxShadow: 'rgba(0, 0, 0, 0.12) 0px 1px 3px',
                            cursor: 'pointer',
                            '&:hover': { boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px' },
                          }}
                        >
                          <CardContent sx={{ p: '12px !important' }}>
                            <Typography sx={{ fontWeight: 500, fontSize: 14 }}>
                              {deal?.name || 'Untitled deal'}
                            </Typography>
                            {deal?.company?.name && (
                              <Typography variant="caption" color="text.secondary">
                                {deal.company.name}
                              </Typography>
                            )}
                            <Typography
                              variant="body2"
                              sx={{ mt: 1, fontWeight: 600 }}
                            >
                              {formatCurrency(deal?.amount, deal?.currency || 'USD')}
                            </Typography>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Card>
      </Grid>
      </Grid>
      <DealDrawer open={drawerOpen} toggle={toggleDrawer} deal={editing} />
    </>
  );
};

export default CrmDeals;
