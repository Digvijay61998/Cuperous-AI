// ** React Imports
import { useCallback, useEffect, useState } from 'react';

// ** MUI Imports
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { DataGrid } from '@mui/x-data-grid';

// ** Custom Components
import CustomAvatar from 'src/@core/components/mui/avatar';

// ** Store & Actions
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import { fetchCompanies } from 'src/store/apps/crm';

// ** Components
import CrmEmptyState from 'src/views/crm/CrmEmptyState';
import CrmTableHeader from 'src/views/crm/CrmTableHeader';

// ** Utils
import { formatDate, humanize, initials } from 'src/views/crm/utils';

const CrmCompanies = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, count } = useSelector((state: RootState) => state.crm.companies);
  const loading = useSelector((state: RootState) => state.crm.loadingCompanies);

  const [value, setValue] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);

  const handleFilter = useCallback((val: string) => {
    setValue(val);
    setPage(0);
  }, []);

  useEffect(() => {
    dispatch(fetchCompanies({ skip: page * pageSize, limit: pageSize, search: value }));
  }, [dispatch, page, pageSize, value]);

  const columns = [
    {
      flex: 0.3,
      minWidth: 240,
      field: 'name',
      headerName: 'Company',
      renderCell: ({ row }: any) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CustomAvatar
            skin="light"
            color="info"
            variant="rounded"
            sx={{ mr: 3, width: 34, height: 34, fontSize: '0.9rem' }}
            src={row?.logoUrl || row?.iconUrl || undefined}
          >
            {initials(row?.name)}
          </CustomAvatar>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography sx={{ fontWeight: 500, lineHeight: 1.2 }}>
              {row?.name || '—'}
            </Typography>
            {row?.domain && (
              <Typography variant="caption" color="text.secondary">
                {row.domain}
              </Typography>
            )}
          </Box>
        </Box>
      ),
    },
    {
      flex: 0.2,
      minWidth: 160,
      field: 'industry',
      headerName: 'Industry',
      renderCell: ({ row }: any) => (
        <Typography variant="body2">{humanize(row?.industry) || '—'}</Typography>
      ),
    },
    {
      flex: 0.2,
      minWidth: 160,
      field: 'location',
      headerName: 'Location',
      renderCell: ({ row }: any) => {
        const loc = [row?.city, row?.country].filter(Boolean).join(', ');

        return <Typography variant="body2">{loc || '—'}</Typography>;
      },
    },
    {
      flex: 0.15,
      minWidth: 120,
      field: 'contacts',
      headerName: 'Contacts',
      renderCell: ({ row }: any) => (
        <Typography variant="body2">
          {row?.contactsCount ?? row?.contacts?.length ?? 0}
        </Typography>
      ),
    },
    {
      flex: 0.15,
      minWidth: 140,
      field: 'createdAt',
      headerName: 'Created',
      renderCell: ({ row }: any) => (
        <Typography variant="body2">{formatDate(row?.createdAt)}</Typography>
      ),
    },
  ];

  const hasData = (data?.length || 0) > 0;

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card
          sx={{
            boxShadow:
              'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px',
          }}
        >
          <CrmTableHeader
            title="Companies"
            searchPlaceholder="Search companies"
            addLabel="Add Company"
            handleFilter={handleFilter}
            toggle={() => {}}
          />
          <Divider sx={{ m: '0 !important' }} />

          {!loading && !hasData ? (
            <CrmEmptyState
              icon="bx:buildings"
              title="No companies yet"
              subtitle="Add your first company, or connect the CRM backend to load your existing accounts."
            />
          ) : (
            <DataGrid
              autoHeight
              loading={loading}
              rows={data ?? []}
              columns={columns}
              getRowId={(row: any) => row?._id || row?.id}
              rowCount={count || 0}
              paginationMode="server"
              page={page}
              pageSize={pageSize}
              rowsPerPageOptions={[10, 25, 50]}
              onPageChange={(newPage: number) => setPage(newPage)}
              onPageSizeChange={(newPageSize: number) => {
                setPageSize(newPageSize);
                setPage(0);
              }}
            />
          )}
        </Card>
      </Grid>
    </Grid>
  );
};

export default CrmCompanies;
