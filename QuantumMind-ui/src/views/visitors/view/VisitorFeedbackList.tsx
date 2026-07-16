// ** React Imports
import { useEffect, useState } from 'react';

import { useRouter } from 'next/router';

// ** MUI Imports
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import LinearProgress from '@mui/material/LinearProgress';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DataGrid } from '@mui/x-data-grid';
import CustomChip from 'src/@core/components/mui/chip';
import { Rating } from '@mui/material';
import { Chip, OutlinedInput, Tooltip } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import Link from 'next/link';
import Icon from 'src/@core/components/icon';

// ** Third Party Imports
import axios from 'axios';

// ** Type Imports
import { ProjectListDataType } from 'src/types/apps/userTypes';
import { useDispatch } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import { fetchVisitorFeedback } from 'src/store/apps/visitor';
import { useSelector } from 'react-redux';
import Grid from '@mui/material/Grid';

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

const InvoiceListTable = ({ tab, visitorId }: Props) => {
  // ** State
  const [value, setValue] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(3);
  const [data, setData] = useState<ProjectListDataType[]>([]);

  const dispatch = useDispatch<AppDispatch>();
  const { visitorDataList } = useSelector(
    (state: any) => state.visitors,
  );

  // ** Router
  const router = useRouter();

  const columns = [
    {
      flex: 0.3,
      minWidth: 230,
      field: 'comment',
      headerName: 'Comment',
    },
    {
      flex: 0.15,
      minWidth: 100,
      field: 'rating',
      headerName: 'Rating',
      renderCell: ({ row }: any) => (
        <Rating value={row.rating ?? null} size="small" readOnly/>
      ),
    }
  ];

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
      <CardHeader title="Feedback" />

      <DataGrid
        autoHeight
        rows={visitorDataList?.feedbacks ?? []}
        columns={columns}
        getRowId={(row: any) => row?._id || row?.id}
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

export default InvoiceListTable;
