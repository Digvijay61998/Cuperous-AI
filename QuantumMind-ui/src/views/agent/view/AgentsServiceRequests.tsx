// ** React Imports
import { useEffect, useState } from 'react';

// ** MUI Imports
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Rating from '@mui/material/Rating';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DataGrid } from '@mui/x-data-grid';
// ** Third Party Imports
import Icon from 'src/@core/components/icon';
import CustomAvatar from 'src/@core/components/mui/avatar';
import { getInitials } from 'src/@core/utils/get-initials';

import { IconButton, Tooltip } from '@mui/material';
import Chip from 'src/@core/components/mui/chip';
import { ThemeColor } from 'src/@core/layouts/types';
import Link from 'next/link';

// ** Type Imports
// import { ProjectListDataType } from 'src/types/apps/userTypes';

// interface CellType {
//   row: ProjectListDataType;
// }
const Img = styled('img')(({ theme }) => ({
  width: 32,
  height: 32,
  borderRadius: '50%',
  marginRight: theme.spacing(3),
}));
interface StatusPriorityType {
  [key: string]: ThemeColor;
}
const serviceRequestObj: StatusPriorityType = {
  active: 'success',
  pending: 'warning',
  low: 'info',
  medium: 'warning',
  high: 'error',
  deferred: 'error',
  open: 'warning',
  closed: 'success',
  critical: 'error'
};
const columns = [
  {
    flex: 0.3,
    minWidth: 230,
    field: 'subject',
    headerName: 'Service Request',
    renderCell: ({row}: any) => (
      // <Link href={`/service-request/view/{row?.id || row?._id}`} style={{cursor:"pointer"}} >
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography sx={{ fontWeight: 500, color: 'text.secondary' }}>
            {row?.subject}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            {row?.description}
          </Typography>
        </Box>
      // </Link>
    ),
  },
  {
    flex: 0.15,
    minWidth: 100,
    field: 'priority',
    headerName: 'Priority',
    renderCell: (params: any) => {
      return (
        <Chip
        rounded
        skin="light"
        size="small"
        label={params?.value}
        color={serviceRequestObj[params?.value?.toLowerCase()]}
      />
      );
    },
  },
  {
    flex: 0.15,
    minWidth: 100,
    field: 'status',
    headerName: 'Status',
    renderCell: (params: any) => (
      <Chip
      rounded
      skin="light"
      size="small"
      label={params?.value}
      color={serviceRequestObj[params?.value?.toLowerCase()]}
    />
    ),
  },
  {
    flex: 0.15,
    minWidth: 200,
    headerName: 'Created On',
    field: 'createdAt',
    renderCell: (params: any) => {
      return (
        <Box sx={{ width: '100%' }}>
        {
          new Date(params?.value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' })
        }
        </Box>
      );
    },
  },
];

const ServiceRequestTable = ({ seriveRequests }: any) => {
  // ** State
  const [pageSize, setPageSize] = useState<number>(10);
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    if (seriveRequests) {
      setData(seriveRequests);
    }
  }, [seriveRequests]);
  const handleSearchRequest = (e: any) => {
    const value = e.target.value;
    const filteredData = seriveRequests.filter((item: any) => {
      let startsWithCondition =
        item?.subject?.toLowerCase().startsWith(value.toLowerCase()) ||
        item?.description?.toLowerCase().startsWith(value.toLowerCase());
      let includesCondition =
        item?.subject?.toLowerCase().includes(value.toLowerCase()) ||
        item?.description?.toLowerCase().includes(value.toLowerCase());
      if (startsWithCondition) {
        return startsWithCondition;
      } else if (!startsWithCondition && includesCondition) {
        return includesCondition;
      } else return null;
    });
    setData(filteredData);
  }
  return (
    <Card>
      {/* <CardHeader title="Conversations" /> */}
      <CardContent>
        <Box
          sx={{
            gap: 4,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '1.25rem', fontWeight: 500 }}>
            Service Request Handled By Agent
          </div>
          <TextField
            size="small"
            placeholder="Search Request"
            onChange={handleSearchRequest}
          />
        </Box>
      </CardContent>
      {data && data?.length > 0 ? (
        <DataGrid
          autoHeight
          rows={data ?? []}
          columns={columns}
          // uniqueId="id"
          getRowId={(row: any) => row?._id || row?.id}
          pageSize={pageSize}
          disableSelectionOnClick
          rowsPerPageOptions={[10, 15, 25, 50]}
          onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
        />
      ) : (
        <Typography
          variant="body2"
          sx={{ color: 'text.disabled', textAlign: 'center', padding: '1rem' }}
        >
          No Conversations Found
        </Typography>
      )}
    </Card>
  );
};

export default ServiceRequestTable;
