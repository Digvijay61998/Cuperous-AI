// ** React Imports
import { useState } from 'react';

import { useRouter } from 'next/router';

// ** MUI Imports
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { DataGrid } from '@mui/x-data-grid';
import CustomChip from 'src/@core/components/mui/chip';
import Rating from '@mui/material/Rating';
import { Tooltip } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import Link from 'next/link';
import Icon from 'src/@core/components/icon';
import CardHeader from '@mui/material/CardHeader';

// ** Third Party Imports

// ** Type Imports
import Grid from '@mui/material/Grid';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from 'src/store';
import { ProjectListDataType } from 'src/types/apps/userTypes';

import { ThemeColor } from 'src/@core/layouts/types';

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

interface Props {
  tab: string;
  //invoiceData: InvoiceType[];
  visitorId: any;
}

interface CellType {
  row: ProjectListDataType;
}
const Img = styled('img')(({ theme }) => ({
  width: 32,
  height: 32,
  borderRadius: '50%',
  marginRight: theme.spacing(3),
}));

const VisitorAgentListTable = ({ tab, visitorId }: Props) => {
  // ** State
  const [value, setValue] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(3);
  const [data, setData] = useState<ProjectListDataType[]>([]);

  const dispatch = useDispatch<AppDispatch>();
  const {visitorDataList} = useSelector((state: any) => state.visitors);

  function createData(botId: any, name: any, createdAt: any, status: any) {
    return { botId, name, createdAt, status };
  }



  // ** Router
  const router = useRouter();

  const columns = [
    {
      flex: 0.25,
      minWidth: 240,
      field: 'name',
      headerName: 'Agent',
      renderCell: ({row}: any) => {
        const { _id, name, email, status } = row;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                flexDirection: 'column',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  alignItems: 'flex-start',
                }}
              >
                <Link href={`/agent/view/${_id}`} passHref>
                  <StyledLink>{name}</StyledLink>
                </Link>
                <CustomChip
                  rounded
                  skin="light"
                  size="small"
                  label={status}
                  color={userStatusObj[status]}
                  sx={{ fontSize: '0.6rem' }}
                />
              </Box>
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
      flex: 0.1,
      minWidth: 100,
      field: 'rating',
      headerName: 'Rating',
      renderCell: ({ row }: any) => (
        <Rating value={row?.rating ?? null} size="small" readOnly/>
      ),
    },
    {
      flex: 0.1,
      minWidth: 100,
      sortable: false,
      field: 'actions',
      headerName: 'Actions',
      renderCell: ({row}: any) => {
        return (
          <>
            <Tooltip placement="top" title="View" arrow>
              <IconButton
                aria-label="View"
                size="small"
                sx={{ mr: 2 }}
                onClick={() => {
                  router.push(`/agent/view/${row?._id || row?.id}`);
                }}
              >
                <Icon icon="bx:show" fontSize={20} />
              </IconButton>
            </Tooltip>
          </>
        );
      },
    },
  ]

  interface AgentStatusType {
    [key: string]: ThemeColor;
  }
  const userStatusObj: AgentStatusType = {
    online: 'success',
    busy: 'error',
    offline: 'secondary',
    away: 'warning',
  };
  return (
   
        <Card sx={{ padding: 4 }}>
      <CardHeader title="Agent" />

          <DataGrid
            autoHeight
            rows={visitorDataList?.agents ?? []}
            columns={columns}
            getRowId={(row: any) => row?._id || row.id || row}
            pageSize={pageSize}
            disableSelectionOnClick
            rowsPerPageOptions={[10, 25, 50]}
            onPageSizeChange={(newPageSize: number) => setPageSize(newPageSize)}
            getRowHeight={() => 'auto'}
            initialState={{
              sorting: {
                sortModel: [{ field: 'createdAt', sort: 'desc' }],
              },
            }}
          />
        </Card>
    
  );
};

export default VisitorAgentListTable;
