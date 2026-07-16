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
import returnPlatformIcon from 'src/components/PlatforomIcons';
import { IconButton, Tooltip } from '@mui/material';


const columns = [
  {
    flex: 0.3,
    minWidth: 230,
    field: 'visitor',
    headerName: 'Visitor Details',
    renderCell: (params: any) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CustomAvatar
      skin="light"
      color={ 'primary'}
      sx={{ mr: 3, width: 32, height: 32, fontSize: '.875rem' }}
    >
      {getInitials(params?.value?.name.toUpperCase() || 'Unknown')}
    </CustomAvatar>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography sx={{ fontWeight: 500, color: 'text.secondary' }}>
            {params?.value?.name}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            {params?.value?.email}
          </Typography>
        </Box>
      </Box>
    ),
  },
  {
    flex: 0.15,
    minWidth: 100,
    field: 'platform',
    headerName: 'Platform',
    renderCell: ({ row }: any) => {
      return (
        <div style={{ width:'100%', display:'flex', justifyContent:'center', alignItems: 'center' }}>
          <Tooltip 
            title={row?.platform.charAt(0).toUpperCase() + row?.platform.slice(1)} 
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
    flex: 0.15,
    minWidth: 100,
    field: 'feedbacks',
    headerName: 'Feedback',
    renderCell: (params: any) => (
      <Typography variant="body2">
        {params?.value && params?.value[0]?.comment}
      </Typography>
    ),
  },
  {
    flex: 0.15,
    minWidth: 200,
    headerName: 'Rating',
    field: 'rating',
    renderCell: ({row}: any) => {

      return (
        <Box sx={{ width: '100%' }}>
          <Rating
            name="read-only"
            value={
              row?.feedbacks && row?.feedbacks.length > 0
                ? row?.feedbacks[0]?.rating
                : 0
            }
            readOnly
          />
        </Box>
      );
    },
  },
  // {
  //   flex: 0.15,
  //   minWidth: 100,
  //   field: 'serviceRequest',
  //   headerName: 'Service Request',
  //   renderCell: (params: any) => (
  //     <Typography variant="body2">{params.value}</Typography>
  //   ),
  // },
];

const InvoiceListTable = ({ conversations }: any) => {
  // ** State
  const [value, setValue] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [data, setData] = useState(conversations);

  useEffect(() => {
    if (conversations) {
      setData(conversations);
    }
  }, [conversations]);
  const handleSearchConversation = (e: any) => {
    const query = e.target.value;
    setValue(query);
    const filteredData = conversations.filter((item: any) => {
      return (
        item?.visitor?.name?.toLowerCase().includes(query.toLowerCase()) ||
        item?.visitor?.email?.toLowerCase().includes(query.toLowerCase()) ||
        item?.visitor?.phone?.toLowerCase().includes(query.toLowerCase())
      );
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
            Conversations
          </div>
          <TextField
            size="small"
            placeholder="Search Conversations"
            value={value}
            onChange={handleSearchConversation}
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

export default InvoiceListTable;
