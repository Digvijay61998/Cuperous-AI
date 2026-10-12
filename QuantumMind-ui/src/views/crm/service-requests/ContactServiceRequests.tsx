// ** A contact's requests, newest first, each opening the drawer (crm-plugins-service-desk R20.1)
import { useCallback, useEffect, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import Icon from 'src/@core/components/icon';
import CustomChip from 'src/@core/components/mui/chip';
import Axios from 'src/helper/Axios';
import type { SrCard } from 'src/store/apps/crm-service-requests';
import { formatDate } from 'src/views/crm/utils';
import SrCreateDialog from './SrCreateDialog';
import SrDetailDrawer from './SrDetailDrawer';
import { priorityColor } from './srFilters';

const PAGE = 25;

const ContactServiceRequests = ({ contactId }: { contactId: string }) => {
  const [rows, setRows] = useState<SrCard[] | null>(null);
  const [count, setCount] = useState(0);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(
    async (skip = 0) => {
      setError(false);
      try {
        const r = await Axios.get('crm/service-requests', {
          params: { view: 'list', contactId, sort: 'created', dir: 'desc', skip, take: PAGE },
        });
        setRows((prev) => (skip && prev ? [...prev, ...r.data.data] : r.data.data));
        setCount(r.data.count || 0);
      } catch {
        setError(true);
        if (!skip) setRows([]);
      }
    },
    [contactId],
  );

  useEffect(() => {
    setRows(null);
    void load();
  }, [load]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="subtitle2" sx={{ flex: 1 }}>
          Service Requests{count ? ` (${count})` : ''}
        </Typography>
        <Button size="small" startIcon={<Icon icon="bx:plus" />} onClick={() => setCreating(true)}>
          New request
        </Button>
      </Box>
      {!rows && <CircularProgress size={20} />}
      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          Could not load the requests.{' '}
          <Button size="small" onClick={() => void load()}>
            Retry
          </Button>
        </Typography>
      )}
      {rows && !rows.length && !error && (
        <Typography variant="body2" color="text.disabled">
          No service requests for this contact.
        </Typography>
      )}
      {rows?.map((r) => (
        <Box
          key={r.id}
          role="button"
          tabIndex={0}
          onClick={() => setOpen(r.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setOpen(r.id);
            }
          }}
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '110px 1fr 140px 140px 110px' },
            gap: 2,
            alignItems: 'center',
            py: 2,
            px: 1,
            cursor: 'pointer',
            borderBottom: (t) => `1px solid ${t.palette.divider}`,
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {r.ref}
          </Typography>
          <Box sx={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
            {r.emergency && <Icon icon="bx:error" fontSize={16} aria-label="Emergency" />}
            <Typography variant="body2" noWrap title={r.subject}>
              {r.subject}
            </Typography>
            <CustomChip rounded skin="light" size="small" label={r.priority} color={priorityColor(r.priority)} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: r.stage?.color || 'grey.400' }} />
            <Typography variant="body2">{r.stage?.name}</Typography>
          </Box>
          <Typography variant="body2" color={r.assigneeId ? 'text.primary' : 'text.disabled'} noWrap>
            {r.assigneeName || 'Unassigned'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatDate(r.createdAt)}
          </Typography>
        </Box>
      ))}
      {rows && rows.length < count && (
        <Button size="small" sx={{ mt: 2 }} onClick={() => void load(rows.length)}>
          Show more
        </Button>
      )}

      <SrDetailDrawer
        id={open}
        onClose={() => {
          setOpen(null);
          void load();
        }}
      />
      <SrCreateDialog
        open={creating}
        contactId={contactId}
        onClose={(created) => {
          setCreating(false);
          if (created?.id) {
            void load();
            setOpen(created.id);
          }
        }}
      />
    </Box>
  );
};

export default ContactServiceRequests;
