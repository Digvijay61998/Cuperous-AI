// ** React Imports
import { useEffect, useState } from 'react';

// ** Next Import
import Link from 'next/link';

// ** MUI Imports
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DataGrid } from '@mui/x-data-grid';
import { ThemeColor } from 'src/@core/layouts/types';

// ** Custom Components Imports
import CustomChip from 'src/@core/components/mui/chip';

// ** Third Party Imports

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


const columns = [
  {
    flex: 0.2,
    minWidth: 140,
    field: 'name',
    headerName: 'Bot',
    renderCell: ({ row }: any) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Link href={`/bots/settings/${row?._id}`}>
          <StyledLink>{row?.name}</StyledLink>
        </Link>
      </Box>
    ),
  },
  {
    flex: 0.1,
    minWidth: 60,
    field: 'published',
    headerName: 'Published',
    renderCell: ({ row }: any) => (
      <Typography variant="body2">{row?.published ? "Yes":"No"}</Typography>
    ),
  },
  {
    flex: 0.1,
    minWidth: 100,
    headerName: 'status',
    field: 'status',
    renderCell: ({ row }: any) => (
      <Box sx={{ width: '100%' }}>
        <CustomChip
          rounded
          skin="light"
          size="small"
          label={row?.status}
          color={userStatusObj[row?.status]}
        />
      </Box>
    ),
  },
  {
    flex: 0.2,
    minWidth: 120,
    field: 'createdAt',
    headerName: 'Created On',
    renderCell: ({ row }: any) => (
      <span>
        {new Date(row?.createdAt).toLocaleDateString('en-US', {
          hour: 'numeric',
          minute: 'numeric',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </span>
    ),
  },
];

const InvoiceListTable = (props:any) => {
  const { agentDetail } = props
  // ** State
  const [value, setValue] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(7);
  const [data, setData] = useState(agentDetail?.assignedBots);

  useEffect(() => {
    if(value && value.trim() !== '') {
      let queryLowered = value.toLowerCase();
      const filteredData = agentDetail?.assignedBots.filter(
        (agent:any) =>
          agent.name.toLowerCase().includes(queryLowered)
      );
      setData(filteredData);
    } else {
      setData(agentDetail?.assignedBots);
    }
  }, [value, agentDetail?.assignedBots]);

  return (
    <Card>
      {/* <CardHeader title="Assigned Bots" /> */}
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
          <div style={{ fontSize:'1.25rem', fontWeight: 500 }}>Assigned Bots</div>
          <TextField
            size="small"
            placeholder="Search Bot"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </Box>
      </CardContent>
      <DataGrid
        autoHeight
        rows={data ?? []}
        columns={columns}
        getRowId={(row: any) => row._id}
        pageSize={pageSize}
        disableSelectionOnClick
        rowsPerPageOptions={[7, 10, 25, 50]}
        onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
      />
    </Card>
  );
};

export default InvoiceListTable;
