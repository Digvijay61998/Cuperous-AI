// ** React Imports
import { useCallback, useEffect, useState } from 'react';

// ** Next Import

// ** MUI Imports
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import { SelectChangeEvent } from '@mui/material/Select';
import { styled } from '@mui/material/styles';
import { DataGrid, GridColumnHeaderParams } from '@mui/x-data-grid';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux';

// ** Custom Components Imports
import CardStatisticsHorizontal from 'src/@core/components/card-statistics/card-stats-horizontal';
import CustomAvatar from 'src/@core/components/mui/avatar';

// ** Utils Import
import { getInitials } from 'src/@core/utils/get-initials';

// ** Actions Imports
import { getsegments } from 'src/store/apps/segments';

// ** Third Party Components

// ** Types Imports
import { CardStatsHorizontalProps } from 'src/@core/components/card-statistics/types';
import { ThemeColor } from 'src/@core/layouts/types';
import { AppDispatch, RootState } from 'src/store';
import { UsersType } from 'src/types/apps/userTypes';

import DeleteSegmentDialog from 'src/views/segments/list/DeleteSegmentDialog';

// ** Custom Table Components Imports
import { Tooltip } from '@mui/material';
import { getSegmentsCardStates } from 'src/store/apps/states';
import AddUserDrawer from 'src/views/apps/user/list/AddUserDrawer';
import TableHeader from 'src/views/segments/list/TableHeader';
import VisitorList from './visitors';

interface UserRoleType {
  [key: string]: { icon: string; color: string };
}

interface UserStatusType {
  [key: string]: ThemeColor;
}

interface CellType {
  row: UsersType;
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

// ** renders client column
const renderClient = (row: UsersType) => {
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

const Segments = () => {
  // ** State
  const [role, setRole] = useState<string>('');
  const [plan, setPlan] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [addUserOpen, setAddUserOpen] = useState<boolean>(false);

  const [statusIcon, setStatusIcon] = useState<string>('error-alt');
  // ** Hooks
  const dispatch = useDispatch<AppDispatch>();
  const [selectedSegment, setSelectedSegment] = useState<string>('');
  const [segmentCardData, setSegmentCardData] = useState<any>([]);

  const [deleteSegmentDialogOpen, setDeleteSegmentDialogOpen] =
    useState<boolean>(false);

  const { segmentStates } = useSelector((state: RootState) => state.states);
  useEffect(() => {
    if (dispatch) dispatch(getSegmentsCardStates());
  }, [dispatch]);
  const avatarIcon: any = {
    total_segments: 'bx:customize',
    total_visitor: 'bx:group',
    new_visitor: 'bx:user-plus',
  };
  useEffect(() => {
    if (segmentStates && segmentStates.length > 0) {
      let mapArr = segmentStates.map((item: any) => {
        return {
          ...item,
          stats: item.stats.toString(),
          avatarIcon: item.title.toLowerCase().includes('total segment')
            ? "/images/new/segments/TOTAL_SEGS.png"
            : item.title.toLowerCase().includes('total visitor')
            ? "/images/new/segments/TOTAL_SEGMENTS.png"
            : item.title.toLowerCase().includes('new visitor')
            ? '/images/new/segments/NEW_VISITORS.png'
            : 'ic:baseline-question-mark',
          avatarColor:
            item.title.toLowerCase().includes('total visitor') 
              ? 'warning'
              : item.title.toLowerCase().includes('new visitor') 
              ? 'success'
              : 'primary',
        };
      });
      setSegmentCardData(mapArr);
    }
  }, [segmentStates]);

  const handleFilter = useCallback((val: string) => {
    setValue(val);
  }, []);

  const handleRoleChange = useCallback((e: SelectChangeEvent) => {
    setRole(e.target.value);
  }, []);

  const handlePlanChange = useCallback((e: SelectChangeEvent) => {
    setPlan(e.target.value);
  }, []);

  const handleStatusChange = useCallback((e: SelectChangeEvent) => {
    setStatus(e.target.value);
  }, []);

  // ** Hooks
  const dis = useDispatch<AppDispatch>();
  const segmentList = useSelector((state: RootState) => state.segments.list);

  const [segmentFilteredList, setSegmentFilteredList] = useState<any>([]);

  useEffect(() => {
    dispatch(getsegments());
  }, [dispatch]);

  useEffect(() => {
    if (value && value.trim() !== '') {
      let queryLowered = value.toLowerCase();
      const filteredData = segmentList?.filter((item: any) =>
        item.name.toLowerCase().includes(queryLowered),
      );
      setSegmentFilteredList(filteredData);
    } else {
      setSegmentFilteredList(segmentList);
    }
  }, [value, segmentList]);

  const handleDelete = (id: string) => {
    setSelectedSegment(id);
    setDeleteSegmentDialogOpen(true);
  };

  const handleStatus = () => {
    setStatusIcon(statusIcon == 'error-alt' ? 'check-square' : 'error-alt');
  };

  const toggleAddUserDrawer = () => setAddUserOpen(!addUserOpen);

  const [open, setOpen] = useState(false);

  // const dispatch = useDispatch<AppDispatch>();

  function handleClickOpen(id: string) {
    setSelectedSegment(id);
    setOpen(true);
  }

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        {segmentCardData && (
          <Grid container spacing={6}>
            {segmentCardData.map(
              (item: CardStatsHorizontalProps, index: number) => {
                return (
                  <Grid item xs={12} md={4} sm={6} key={index}>
                    <CardStatisticsHorizontal {...item} />
                  </Grid>
                );
              },
            )}
          </Grid>
        )}
      </Grid>
      <Grid item xs={12}>
        <Card
          sx={{
            boxShadow:
              'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px',
          }}
        >
          <Divider sx={{ m: '0 !important' }} />
          <TableHeader
            value={value}
            handleFilter={handleFilter}
            toggle={toggleAddUserDrawer}
          />
          <DataGrid
            autoHeight
            getRowId={(row: any) => row?._id || row?.id}
            rows={segmentFilteredList ?? []}
            columns={[
              {
                flex: 1,
                minWidth: 150,
                field: 'name',
                headerName: 'Name',
                headerClassName: 'custom-header',
                renderCell: ({ row }: any) => {
                  const { _id, name } = row;

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
                        {/* <Link href={`/segments/visitor/${_id}`} passHref> 
                        <StyledLink>*/}
                        {name}
                        {/* </StyledLink>
                        </Link> */}
                      </Box>
                    </Box>
                  );
                },
              },
              {
                flex: 0.1,
                field: 'visitors',
                minWidth: 140,
                headerName: 'Total Visitors',
                headerClassName: 'custom-header',
                renderCell: ({ row }: any) => {
                  return (
                    <div style={{ width: '100%', textAlign: 'center' }}>
                      {row?.visitors?.length}
                    </div>
                  );
                },
              },
              // {
              //   flex: 0.1,
              //   field: 'data2',
              //   minWidth: 120,
              //   headerName: 'New Visitors',
              // },
              // {
              //   flex: 0.1,
              //   field: '',
              //   minWidth: 130,
              //   headerName: 'Show Visitors',
              //   headerClassName : "custom-header",
              //   renderCell: ({ row }: any) => {
              //     const { _id, name } = row;

              //     return (
              //       <div>
              //         <Button
              //           variant="outlined"
              //           onClick={() => handleClickOpen(_id)}
              //           disabled={(row?.visitors?.length > 0)? false: true}
              //         >
              //           View
              //         </Button>
              //       </div>
              //     );
              //   },
              // },
              {
                flex: 1,
                field: 'createdAt',
                minWidth: 100,
                headerName: 'Created On',
                headerClassName: 'custom-header',
                renderCell: (params: any) =>
                  new Date(params.value).toLocaleString(),
              },
              {
                flex: 1,
                field: 'updatedAt',
                minWidth: 100,
                headerName: 'Last Updated',
                headerClassName: 'custom-header',
                renderCell: (params: any) =>
                  new Date(params.value).toLocaleString(),
              },
              {
                flex: 0.1,
                minWidth: 90,
                sortable: false,
                field: 'actions',
                headerName: 'Actions',
                headerClassName: 'custom-header',
                renderCell: ({ row }: any) => {
                  return (
                    <>
                      {/* <IconButton
                        aria-label="Edit"
                        size="small"
                        sx={{ mr: 2 }}
                        // onClick={() => handleDelete(row)}
                      >
                        <Icon icon="bx:edit" fontSize={20} />
                      </IconButton>
                      <IconButton
                        aria-label="Edit"
                        size="small"
                        sx={{ mr: 2 }}
                        onClick={() => handleStatus()}
                      >
                        <Icon icon="bx:error-alt" fontSize={20} />
                      </IconButton> */}
                      <Tooltip title={'Delete'} placement="top" arrow>
                        <IconButton
                          aria-label="Delete"
                          size="small"
                          color="error"
                          sx={{ mr: 2 }}
                          onClick={() => handleDelete(row?._id || row?.id)}
                        >
                          <Icon icon="bx:trash" fontSize={20} />
                        </IconButton>
                      </Tooltip>
                    </>
                  );
                },
              },
            ]}
            pageSize={pageSize}
            disableSelectionOnClick
            rowsPerPageOptions={[10, 25, 50]}
            onPageSizeChange={(newPageSize: number) => setPageSize(newPageSize)}
          />
        </Card>
      </Grid>

      <AddUserDrawer open={addUserOpen} toggle={toggleAddUserDrawer} />

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth={true}
        maxWidth={'xl'}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        
      >
        <Box>
          <VisitorList segmentId={selectedSegment} />
        </Box>
        <Divider />
        <DialogActions
        // sx={{ justifyContent:'center' }}
        >
          <Button onClick={handleClose} variant="contained" autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <DeleteSegmentDialog
        segmentId={selectedSegment}
        open={deleteSegmentDialogOpen}
        setOpen={setDeleteSegmentDialogOpen}
      />
    </Grid>
  );
};

export default Segments;
