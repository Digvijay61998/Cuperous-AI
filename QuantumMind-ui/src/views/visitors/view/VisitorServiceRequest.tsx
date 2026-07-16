// ** React Imports
import { useState, useEffect } from 'react';

// ** MUI Imports
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { DataGrid } from '@mui/x-data-grid';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import LinearProgress from '@mui/material/LinearProgress';
import CustomChip from 'src/@core/components/mui/chip';
import Chip from '@mui/material/Chip';

// ** Third Party Imports
import axios from 'axios';

// ** Type Imports
import { ProjectListDataType } from 'src/types/apps/userTypes';
import { useDispatch } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import { fetchVisitorDetail } from 'src/store/apps/visitor';
import { useSelector } from 'react-redux'
import { ThemeColor } from 'src/@core/layouts/types';


interface Props {
  tab: string
  //invoiceData: InvoiceType[];
  visitorId: any
}

interface CellType {
  row: ProjectListDataType;
}

interface UserStatusType {
  [key: string]: ThemeColor;
}

const userStatusObj: UserStatusType = {
  active: 'success',
  pending: 'warning',
  inactive: 'secondary',
};

const InvoiceListTable = ({ tab, visitorId}: Props) => {
  // ** State
  const [value, setValue] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(3);
  const [data, setData] = useState<ProjectListDataType[]>([]);


  const dispatch = useDispatch<AppDispatch>();
 
  const {visitorDataListServiceRequest} = useSelector((state: any) => state.visitors);

  const columns = [
    {
      flex: 0.20,
      minWidth: 100,
      field: 'subject',
      headerName: 'Subject',
      
      renderCell: ({ row }: any) => {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography
              noWrap
              sx={{ color: 'text.secondary', textTransform: 'capitalize' }}
            >
              {row.subject}
            </Typography>
          </Box>
          
        );
      },
      
    },
    {
      flex: 0.20,
      minWidth: 100,
      field: 'tags',
      headerName: 'Tags',
      renderCell: ({ row }: any) => {
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            {row?.tags?.length > 0 ? (
              <>
                {row?.tags?.map((item: any, index: number) => (
                  <Chip
                    key={index}
                    label={item?.name || item}
                    size="small"
                    color="primary"
                    sx={{ margin: '1.2px', fontSize: '7.7px' }}
                  />
                ))}
              </>
            ) : (
              <>N/A</>
            )}
          </div>
        );
      },      
    },
    {
      flex: 0.20,
      minWidth: 100,
      field: 'Priority',
      headerName: 'Priority',
      
      renderCell: ({ row }: any) => {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography
              noWrap
              sx={{ color: 'text.secondary', textTransform: 'capitalize' }}
            >
              {row.priority}
            </Typography>
          </Box>
          
        );
      },
    },
    {
      flex: 0.20,
      minWidth: 100,
      field: 'Status',
      headerName: 'Status',
      
      renderCell: ({ row }: any) => {
        return (
          <CustomChip
            rounded
            skin="light"
            size="small"

            label={row.status}
            color={row.status === "OPEN" ? "warning" : row.status === "CLOSED" ? undefined : "error" }
          />
        );
      },
    },
    
  ];
  
  return (
    <Card sx={{ padding: 4 }}>
      <CardHeader title="Service Request" />
      <DataGrid
        autoHeight
        rows={visitorDataListServiceRequest ?? []}
        columns={columns}
        getRowId={(row: any) => row?._id || row?.id}
        pageSize={pageSize}
        disableSelectionOnClick
        rowsPerPageOptions={[7, 10, 25, 50]}
        onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
      />
    </Card>

    
  );
};

export default InvoiceListTable;
