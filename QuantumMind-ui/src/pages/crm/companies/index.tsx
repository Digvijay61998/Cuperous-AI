// ** React Imports
import { useCallback, useEffect, useState } from 'react';

// ** Next Import
import { useRouter } from 'next/router';

// ** MUI Imports
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { DataGrid } from '@mui/x-data-grid';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

// ** Custom Components
import CustomAvatar from 'src/@core/components/mui/avatar';
import Icon from 'src/@core/components/icon';

// ** Store & Actions
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import { deleteCompany, fetchCompanies } from 'src/store/apps/crm';

// ** Components
import CrmEmptyState from 'src/views/crm/CrmEmptyState';
import CrmTableHeader from 'src/views/crm/CrmTableHeader';
import CompanyDrawer from 'src/views/crm/CompanyDrawer';
import SavedViewsBar from 'src/views/crm/SavedViewsBar';

// ** Utils
import { formatDate, humanize, initials } from 'src/views/crm/utils';

const CrmCompanies = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { data, count, fieldColumns } = useSelector(
    (state: RootState) => state.crm.companies,
  );
  const loading = useSelector((state: RootState) => state.crm.loadingCompanies);

  const [value, setValue] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<any>(null);

  const handleFilter = useCallback((val: string) => {
    setValue(val);
    setPage(0);
  }, []);

  const openCreate = () => {
    setEditing(null);
    setDrawerOpen(true);
  };
  const openEdit = (row: any) => {
    setEditing(row);
    setDrawerOpen(true);
  };
  const toggleDrawer = () => setDrawerOpen((o) => !o);
  const handleDelete = (id: string) => {
    if (id) dispatch(deleteCompany(id));
  };

  useEffect(() => {
    dispatch(fetchCompanies({ page: page + 1, pageSize, q: value }));
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
            <Typography
              onClick={() => router.push(`/crm/companies/${row?._id || row?.id}`)}
              sx={{
                fontWeight: 500,
                lineHeight: 1.2,
                cursor: 'pointer',
                '&:hover': { color: 'primary.main' },
              }}
            >
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
          {row?._count?.contacts ?? row?.contactsCount ?? row?.contacts?.length ?? 0}
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
    {
      flex: 0.12,
      minWidth: 110,
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      renderCell: ({ row }: any) => (
        <>
          <Tooltip title="Edit" arrow placement="top">
            <IconButton size="small" color="primary" onClick={() => openEdit(row)}>
              <Icon icon="bx:pencil" fontSize={18} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete" arrow placement="top">
            <IconButton
              size="small"
              color="error"
              onClick={() => handleDelete(row?._id || row?.id)}
            >
              <Icon icon="bx:trash" fontSize={18} />
            </IconButton>
          </Tooltip>
        </>
      ),
    },
  ];

  const dynamicColumns = (fieldColumns || []).map((col: any) => ({
    flex: 0.15,
    minWidth: 150,
    field: `cf_${col.id}`,
    headerName: col.label,
    sortable: false,
    renderCell: ({ row }: any) => {
      const v = row?.fields?.[col.id];
      const shown =
        v === null || v === undefined || v === ''
          ? '—'
          : typeof v === 'boolean'
          ? v
            ? 'Yes'
            : 'No'
          : String(v);

      return <Typography variant="body2">{shown}</Typography>;
    },
  }));
  const allColumns = [
    ...columns.slice(0, -1),
    ...dynamicColumns,
    columns[columns.length - 1],
  ];

  const hasData = (data?.length || 0) > 0;

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
            title="Companies"
            searchPlaceholder="Search companies"
            addLabel="Add Company"
            handleFilter={handleFilter}
            toggle={openCreate}
          />
          <Divider sx={{ m: '0 !important' }} />
          <SavedViewsBar
            entity="COMPANY"
            currentFilters={{ q: value }}
            onApply={(f) => {
              setValue(f?.q || '');
              setPage(0);
            }}
          />
          <Divider sx={{ m: '0 !important' }} />

          {!loading && !hasData ? (
            <CrmEmptyState
              icon="bx:buildings"
              title="No companies yet"
              subtitle="Add your first company to start building your CRM."
              actionLabel="Add Company"
              onAction={openCreate}
            />
          ) : (
            <DataGrid
              autoHeight
              loading={loading}
              rows={data ?? []}
              columns={allColumns}
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
      <CompanyDrawer open={drawerOpen} toggle={toggleDrawer} company={editing} />
    </>
  );
};

export default CrmCompanies;
