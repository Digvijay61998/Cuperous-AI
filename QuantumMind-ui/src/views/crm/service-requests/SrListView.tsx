// ** List view of the same filtered requests (crm-plugins-service-desk R11.5)
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { DataGrid, GridSortModel } from '@mui/x-data-grid';

import { useSelector } from 'react-redux';
import { RootState } from 'src/store';
import type { SrCard, SrState } from 'src/store/apps/crm-service-requests';
import CustomChip from 'src/@core/components/mui/chip';
import Icon from 'src/@core/components/icon';
import { formatDate } from 'src/views/crm/utils';
import { channelLabel, contactName, priorityColor } from './srFilters';

/** Grid field -> API sort key (only these sort on the server). */
const SORT_KEYS: Record<string, string> = {
  ref: 'ref',
  subject: 'subject',
  priority: 'priority',
  createdAt: 'created',
  updatedAt: 'updated',
};
const FIELD_FOR_SORT = Object.fromEntries(Object.entries(SORT_KEYS).map(([f, k]) => [k, f]));

interface Props {
  page: number;
  pageSize: number;
  sort: string;
  dir: 'asc' | 'desc';
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
  onSort: (sort: string, dir: 'asc' | 'desc') => void;
  onOpen: (id: string) => void;
}

const SrListView = ({ page, pageSize, sort, dir, onPage, onPageSize, onSort, onOpen }: Props) => {
  const { rows, count, loading } = useSelector((s: RootState) => ((s as any).crmServiceRequests as SrState).list);

  const columns = [
    {
      field: 'ref',
      headerName: 'Ref',
      minWidth: 110,
      flex: 0.1,
      renderCell: ({ row }: { row: SrCard }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {row.emergency && <Icon icon="bx:error" fontSize={16} color="red" aria-label="Emergency" />}
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.ref}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'subject',
      headerName: 'Subject',
      minWidth: 220,
      flex: 0.3,
      renderCell: ({ row }: { row: SrCard }) => (
        <Typography variant="body2" noWrap title={row.subject}>
          {row.subject}
        </Typography>
      ),
    },
    {
      field: 'stage',
      headerName: 'Stage',
      minWidth: 140,
      flex: 0.14,
      sortable: false,
      renderCell: ({ row }: { row: SrCard }) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: row.stage?.color || 'grey.400' }} />
          <Typography variant="body2">{row.stage?.name}</Typography>
        </Box>
      ),
    },
    {
      field: 'priority',
      headerName: 'Priority',
      minWidth: 110,
      flex: 0.1,
      renderCell: ({ row }: { row: SrCard }) => (
        <CustomChip rounded skin="light" size="small" label={row.priority} color={priorityColor(row.priority)} />
      ),
    },
    {
      field: 'assigneeName',
      headerName: 'Assignee',
      minWidth: 140,
      flex: 0.14,
      sortable: false,
      renderCell: ({ row }: { row: SrCard }) => (
        <Typography variant="body2" color={row.assigneeId ? 'text.primary' : 'text.disabled'}>
          {row.assigneeName || 'Unassigned'}
        </Typography>
      ),
    },
    {
      field: 'contact',
      headerName: 'Contact',
      minWidth: 150,
      flex: 0.14,
      sortable: false,
      renderCell: ({ row }: { row: SrCard }) => (
        <Typography variant="body2">{contactName(row.contact) ?? 'Not linked'}</Typography>
      ),
    },
    {
      field: 'channel',
      headerName: 'Channel',
      minWidth: 120,
      flex: 0.1,
      sortable: false,
      renderCell: ({ row }: { row: SrCard }) => <Typography variant="body2">{channelLabel(row.channel)}</Typography>,
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      minWidth: 130,
      flex: 0.12,
      renderCell: ({ row }: { row: SrCard }) => <Typography variant="body2">{formatDate(row.createdAt)}</Typography>,
    },
    {
      field: 'updatedAt',
      headerName: 'Updated',
      minWidth: 130,
      flex: 0.12,
      renderCell: ({ row }: { row: SrCard }) => <Typography variant="body2">{formatDate(row.updatedAt)}</Typography>,
    },
  ];

  const sortModel: GridSortModel = FIELD_FOR_SORT[sort] ? [{ field: FIELD_FOR_SORT[sort], sort: dir }] : [];

  return (
    <DataGrid
      autoHeight
      loading={loading}
      rows={rows}
      columns={columns as any}
      getRowId={(r: any) => r.id}
      rowCount={count}
      paginationMode="server"
      sortingMode="server"
      sortModel={sortModel}
      onSortModelChange={(m: GridSortModel) => {
        const s = m[0];
        if (!s?.sort) onSort('created', 'desc');
        else onSort(SORT_KEYS[s.field] || 'created', s.sort);
      }}
      page={page}
      pageSize={pageSize}
      rowsPerPageOptions={[25, 50, 100]}
      onPageChange={onPage}
      onPageSizeChange={onPageSize}
      onRowClick={(p: any) => onOpen(String(p.id))}
      disableSelectionOnClick
      sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
      localeText={{ noRowsLabel: 'No requests match these filters' }}
    />
  );
};

export default SrListView;
