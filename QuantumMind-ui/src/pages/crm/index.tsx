// ** React Imports
import { useEffect } from 'react';

// ** Next Import
import Link from 'next/link';

// ** MUI Imports
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

// ** Store & Actions
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import { fetchCrmStats } from 'src/store/apps/crm';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Custom Components
import CustomAvatar from 'src/@core/components/mui/avatar';

// ** Utils
import { formatCurrency } from 'src/views/crm/utils';
import useCrmPlugins from 'src/views/crm/plugins/useCrmPlugins';

interface StatDef {
  key: string;
  title: string;
  icon: string;
  color: 'primary' | 'success' | 'warning' | 'info' | 'error' | 'secondary';
  isCurrency?: boolean;
  /** Shown only while this CRM plugin is on (crm-plugins-service-desk R8.1). */
  plugin?: string;
}

const STATS: StatDef[] = [
  { key: 'contacts', title: 'Contacts', icon: 'bx:user', color: 'primary' },
  { key: 'companies', title: 'Companies', icon: 'bx:buildings', color: 'info', plugin: 'companies' },
  { key: 'openDeals', title: 'Open Deals', icon: 'bx:trending-up', color: 'warning', plugin: 'deals' },
  {
    key: 'pipelineValue',
    title: 'Pipeline Value',
    icon: 'bx:dollar-circle',
    color: 'success',
    isCurrency: true,
    plugin: 'deals',
  },
];

interface QuickLink {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: 'primary' | 'success' | 'warning' | 'info';
  plugin: string;
}

const QUICK_LINKS: QuickLink[] = [
  {
    title: 'Contacts',
    description: 'People you do business with. Owners, leads and their details.',
    icon: 'bx:user',
    href: '/crm/contacts',
 plugin: 'contacts',
    color: 'primary',
  },
  {
    title: 'Companies',
    description: 'Accounts and organisations, with branding and primary contacts.',
    icon: 'bx:buildings',
    href: '/crm/companies',
 plugin: 'companies',
    color: 'info',
  },
  {
    title: 'Deals',
    description: 'Your sales pipeline across stages, amounts and expected close.',
    icon: 'bx:trending-up',
    href: '/crm/deals',
 plugin: 'deals',
    color: 'warning',
  },
];

const CrmOverview = () => {
  const dispatch = useDispatch<AppDispatch>();
  const stats = useSelector((state: RootState) => state.crm.stats);

  const { plugins, isOn } = useCrmPlugins();

  useEffect(() => {
    dispatch(fetchCrmStats());
    // Refetch when a plugin is toggled: off plugins report null figures.
  }, [dispatch, plugins]);

  // A card shows while its plugin is on and the API sent a figure for it.
  const stats_ = STATS.filter((d) => (!d.plugin || isOn(d.plugin)) && stats?.[d.key] !== null);
  const links = QUICK_LINKS.filter((l) => isOn(l.plugin)).sort(
    (a, b) =>
      (plugins?.find((p) => p.key === a.plugin)?.position ?? 0) -
      (plugins?.find((p) => p.key === b.plugin)?.position ?? 0),
  );
  const subtitle = `Manage ${links.map((l) => l.title.toLowerCase()).join(', ').replace(/, ([^,]*)$/, ' and $1')} in one place.`;

  const statValue = (def: StatDef) => {
    const raw = stats?.[def.key] ?? 0;
    if (def.isCurrency) return formatCurrency(raw, stats?.currency || 'USD');
    return Number(raw).toLocaleString();
  };

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant="h5" sx={{ mb: 1 }}>
          CRM
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </Grid>

      {/* Stat cards */}
      {stats_.map((def) => (
        <Grid item xs={12} sm={6} md={3} key={def.key}>
          <Card
            sx={{
              boxShadow:
                'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px',
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography sx={{ mb: 1, color: 'text.secondary' }}>
                    {def.title}
                  </Typography>
                  <Typography variant="h5">{statValue(def)}</Typography>
                </Box>
                <CustomAvatar
                  skin="light"
                  variant="rounded"
                  color={def.color}
                  sx={{ width: 42, height: 42 }}
                >
                  <Icon icon={def.icon} />
                </CustomAvatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}

      {/* Quick links */}
      {links.map((link) => (
        <Grid item xs={12} md={4} key={link.href}>
          <Link href={link.href} passHref>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s ease',
                boxShadow:
                  'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px',
                '&:hover': {
                  boxShadow: 'rgba(0, 0, 0, 0.3) 0px 6px 14px',
                },
              }}
            >
              <CardContent sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
                <CustomAvatar
                  skin="light"
                  variant="rounded"
                  color={link.color}
                  sx={{ width: 48, height: 48 }}
                >
                  <Icon icon={link.icon} fontSize={24} />
                </CustomAvatar>
                <Box>
                  <Typography sx={{ fontWeight: 600, mb: 1 }}>{link.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {link.description}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Link>
        </Grid>
      ))}
    </Grid>
  );
};

export default CrmOverview;
