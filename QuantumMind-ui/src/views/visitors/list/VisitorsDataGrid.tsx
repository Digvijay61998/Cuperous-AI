// ** React Imports
import {
    useEffect,
  useState,
} from 'react';

// ** Next Import
import Link from 'next/link';

// ** MUI Imports
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import { Tooltip, Typography } from '@mui/material';

// ** Utils Imports
import Icon from 'src/@core/components/icon';
import CustomAvatar from 'src/@core/components/mui/avatar';
import { getInitials } from 'src/@core/utils/get-initials';
import { ThemeColor } from 'src/@core/layouts/types';
import returnPlatformIcon from 'src/components/PlatforomIcons';
import RemoveVisitorDialog from 'src/views/visitors/list/RemoveVisitorDialog';

interface UserStatusType {
  [key: string]: ThemeColor;
}

const userStatusObj: UserStatusType = {
  active: 'success',
  pending: 'warning',
  inactive: 'secondary',
};

const StyledLink = styled('a')(({ theme }) => ({
  fontWeight: 600,
  fontSize: '1rem',
  cursor: 'pointer',
  textDecoration: 'none',
  color: theme.palette.text.secondary,
  '&:hover': {
    color: theme.palette.primary.main,
  },
}));


const renderClient = (row: any) => {
  return (
    <CustomAvatar
      skin="light"
      color={row.avatarColor || 'primary'}
      sx={{ mr: 3, width: 32, height: 32, fontSize: '.875rem' }}
    >
      {getInitials(row.name ? row.name : 'John Doe')}
    </CustomAvatar>
  );
};

const VisitorList = ({ 
  isLoading, rowCountState, page, setPage, pageSize, setPageSize, rowsPerPageOptions=[10, 20, 30],
  visitorListDataFiltered, segmentId='' }: any) => {
  // ** State

  const [selectedVisitorId, setSelectedVisitorId] = useState<string>('');
  const [removeVisitorDialogOpen, setRemoveVisitorDialogOpen] = useState<boolean>(false);

  const handleRemoveVisitor = (row:any) => {
    setSelectedVisitorId(row?._id || row?.id);
    setRemoveVisitorDialogOpen(true);
  };

  return (<>
    <DataGrid
      autoHeight
      getRowId={(row: any) => row?._id || row?.id }
      rows={visitorListDataFiltered ?? []}
      columns={[
        {
          flex: 1,
          minWidth: 240,
          field: 'name',
          headerName: 'Name',
          headerClassName : "custom-header",
          renderCell: ({ row }: any) => {
          const { _id, name, email } = row;

          return (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {renderClient(row)}
              <Box
                  sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  flexDirection: 'column',
                  }}
              >
                  <Link href={`/visitors/view/${_id}`} passHref>
                      <StyledLink>{name}</StyledLink>
                  </Link>
              </Box>
              </Box>
          );
          },
      },
      {
        // flex: 0.5,
        // minWidth: 100,
        headerName: 'Platform',
        field: 'platform',
        headerClassName : "custom-header",
        renderCell: ({ row }: any) => {
          return (
            <div style={{ width:'100%', display:'flex', justifyContent:'center', alignItems: 'center' }}>
              <Tooltip 
                title={row?.platform?.charAt(0)?.toUpperCase() + row?.platform?.slice(1)} 
                placement='top' 
                arrow
              >
                <IconButton
                  aria-label="Platform"
                  size="small"
                >
                  {returnPlatformIcon(row?.platform)}
                </IconButton>
              </Tooltip>
            </div>
          );
        },
      },
      {
          flex: 1,
          field: 'bot',
          minWidth: 160,
          headerName: 'Bot Name',
          headerClassName : "custom-header",
          renderCell: (params: any) => {

          return (
            <Box
            sx={{
            display: 'flex',
            alignItems: 'flex-start',
            flexDirection: 'column',
            }}
        >
            <Link href={`/bots/settings/${params?.value?._id || params?.value?.id}`} passHref>
                <StyledLink>{params?.value?.name}</StyledLink>
            </Link>
        </Box>
          );
          },
      },
      {
          flex: 1,
          minWidth: 220,
          field: 'phone',
          headerName: 'Phone & EmailId',
          headerClassName : "custom-header",
          renderCell: ({ row }: any) => {
          const { _id, phone, email } = row;

          return (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                  sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  flexDirection: 'column',
                  }}
              >
                  <Typography>
                      {phone}
                  </Typography>
                  <Typography
                      noWrap
                      variant="caption"
                      sx={{ color: 'text.disabled' }}
                  >
                      {email}
                  </Typography>
              </Box>
              </Box>
          );
          },
      },
      {
          flex: 1,
          minWidth: 180,
          field: 'createdAt',
          headerName: 'When',
          headerClassName : "custom-header",
          renderCell: ({ row }: any) => {
          return (
              <span>
              {new Date(row.createdAt).toLocaleDateString('en-US', {
                  hour: 'numeric',
                  minute: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
              })}
              </span>
          );
          },
      },
      {
          flex: 0.1,
          minWidth: 120,
          sortable: false,
          field: 'actions',
          headerName: 'Actions',
          headerClassName : "custom-header",
          renderCell: ({ row }: any) => {
          return (
              <>
              <Link href={`/visitors/view/${row?._id || row?.id}`} passHref>
                <Tooltip
                  title={'View'}
                  placement="top"
                  arrow
                >
                  <IconButton
                    aria-label="View"
                    size="small"
                    sx={{ mr: 2 }}
                    color="secondary"
                  >
                    <Icon icon="bx:show" fontSize={20} />
                  </IconButton>
                </Tooltip>
              </Link>

              {segmentId &&
                <Tooltip
                  title={'Remove'}
                  placement="top"
                  arrow
                >
                  <IconButton
                    aria-label="Remove"
                    size="small"
                    sx={{ mr: 2 }}
                    color="error"
                    onClick={() => handleRemoveVisitor(row)}
                  >
                    <Icon icon="maki:cross" fontSize={20} />
                  </IconButton>
                </Tooltip>
              }
              </>
          );
          },
      },
      ]}
      rowCount={rowCountState}
      loading={isLoading}
      rowsPerPageOptions={rowsPerPageOptions}
      pagination
      page={page}
      pageSize={pageSize}
      paginationMode="server"
      disableSelectionOnClick
      onPageChange={(newPage) => setPage(newPage)}
      onPageSizeChange={(newPageSize: number) => {
        setPageSize(newPageSize);
        setPage(0);
      }}
    />

    {removeVisitorDialogOpen && <RemoveVisitorDialog
      segmentId={segmentId}
      visitorId={selectedVisitorId}
      open={removeVisitorDialogOpen}
      setOpen={setRemoveVisitorDialogOpen}
    />}
  </>);
};

export default VisitorList;
