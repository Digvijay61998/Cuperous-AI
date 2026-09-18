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
import CustomChip from 'src/@core/components/mui/chip';

// ** Store & Actions
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import { fetchContacts } from 'src/store/apps/crm';

// ** Components
import CrmEmptyState from 'src/views/crm/CrmEmptyState';
import CrmTableHeader from 'src/views/crm/CrmTableHeader';

// ** Utils
import { formatDate, initials, statusColor } from 'src/views/crm/utils';

const CrmContacts = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, count } = useSelector((state: RootState) => state.crm.contacts);
  const loading = useSelector((state: RootState) => state.crm.loadingContacts);

  const [value, setValue] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);

  const handleFilter = useCallback((val: string) => {
    setValue(val);
    setPage(0);
  }, []);

  useEffect(() => {
    dispatch(fetchContacts({ skip: page * pageSize, limit: pageSize, search: value }));
  }, [dispatch, page, pageSize, value]);

  const columns = [
    {
      flex: 0.3,
      minWidth: 240,
      field: 'name',
      headerName: 'Name',
      renderCell: ({ row }: any) => {
        const name =
          row?.name ||
          [row?.firstName, row?.lastName].filter(Boolean).join(' ') ||
          '—';

        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CustomAvatar
              skin="light"
              color="primary"
              sx={{ mr: 3, width: 34, height: 34, fontSize: '0.9rem' }}
              src={row?.imageUrl || undefined}
            >
              {initials(name)}
            </CustomAvatar>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography sx={{ fontWeight: 500, lineHeight: 1.2 }}>{name}</Typography>
              {row?.title && (
                <Typography variant="caption" color="text.secondary">
                  {row.title}
                </Typography>
              )}
            </Box>
          </Box>
        );
      },
    },
    {
      flex: 0.25,
      minWidth: 200,
      field: 'email',
      headerName: 'Email',
      renderCell: ({ row }: any) => (
        <Typography variant="body2">{row?.email || '—'}</Typography>
      ),
    },
    {
      flex: 0.2,
      minWidth: 180,
      field: 'company',
      headerName: 'Company',
      renderCell: ({ row }: any) => (
        <Typography variant="body2">
          {row?.company?.name || row?.companyName || '—'}
        </Typography>
      ),
    },
    {
      flex: 0.15,
      minWidth: 120,
      field: 'status',
      headerName: 'Status',
      renderCell: ({ row }: any) =>
        row?.status ? (
          <CustomChip
            rounded
            skin="light"
            size="small"
            label={row.status}
            color={statusColor(row.status)}
          />
        ) : (
          <>—</>
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
            title="Contacts"
            searchPlaceholder="Search contacts"
            addLabel="Add Contact"
            handleFilter={handleFilter}
            toggle={() => {}}
          />
          <Divider sx={{ m: '0 !important' }} />

          {!loading && !hasData ? (
            <CrmEmptyState
              icon="bx:user"
              title="No contacts yet"
              subtitle="Add your first contact, or connect the CRM backend to load your existing records."
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

export default CrmContacts;
