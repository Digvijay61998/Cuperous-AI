// ** React Imports
import { forwardRef, useCallback, useEffect, useState } from 'react';

// ** Next Import
import Link from 'next/link';

// ** MUI Imports
import { Chip, OutlinedInput, Tooltip } from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DataGrid } from '@mui/x-data-grid';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux';

// ** Custom Components Imports
import CardStatisticsHorizontal from 'src/@core/components/card-statistics/card-stats-horizontal';
import CustomChip from 'src/@core/components/mui/chip';

// ** Utils Import

// ** Actions Imports

// ** Third Party Components

// ** Types Imports
import { CardStatsHorizontalProps } from 'src/@core/components/card-statistics/types';
import { ThemeColor } from 'src/@core/layouts/types';
import { AppDispatch, RootState } from 'src/store';

import { fetchAllTicketsData } from 'src/store/apps/service-request';

// ** Custom Table Components Imports
import format from 'date-fns/format';
import DatePicker from 'react-datepicker';
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker';
import { fetchBotData } from 'src/store/apps/bots';
import { getTicketCardStates } from 'src/store/apps/states';
import { gettag } from 'src/store/apps/tags';
import { DateType } from 'src/types/forms/reactDatepickerTypes';
import AddUserDrawer from 'src/views/apps/user/list/AddUserDrawer';
import SRAssignDialog from 'src/views/service-request/list/SRAssignDialog';
import SRCloseDialog from 'src/views/service-request/list/SRCloseDialog';
import SRDeferDialog from 'src/views/service-request/list/SRDeferDialog';
import TableHeader from 'src/views/service-request/list/TableHeader';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      // width: 250,
    },
  },
};

interface UserRoleType {
  [key: string]: { icon: string; color: string };
}

interface StatusPriorityType {
  [key: string]: ThemeColor;
}

interface CustomInputProps {
  dates: Date[];
  label: string;
  end: number | Date;
  start: number | Date;
  setDates?: (value: Date[]) => void;
}

const CustomInput = forwardRef((props: CustomInputProps, ref) => {
  const startDate =
    props.start !== null ? format(props.start, 'MM/dd/yyyy') : '';
  const endDate =
    props.end !== null ? ` - ${format(props.end, 'MM/dd/yyyy')}` : null;

  const value = `${startDate}${endDate !== null ? endDate : ''}`;
  props.start === null && props.dates.length && props.setDates
    ? props.setDates([])
    : null;
  const updatedProps = { ...props };
  delete updatedProps.setDates;

  return (
    <TextField
      fullWidth
      inputRef={ref}
      size="small"
      {...updatedProps}
      label={props.label || ''}
      value={value}
    />
  );
});

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

const avatarIcon: any = {
  total_ticket: 'mdi:pencil-box-multiple',
  closed_ticket: 'fluent:comment-multiple-checkmark-24-filled',
  open_ticket: 'fluent:comment-multiple-link-24-filled',
  critical_ticket: 'fluent:radar-rectangle-multiple-20-filled'
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

const UserList = () => {
  // ** State
  const [bot, setBot] = useState<any>([]);
  const [tagFiltered, setTagFiltered] = useState<any>([]);
  const [value, setValue] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');

  const [pageSize, setPageSize] = useState<number>(10);
  const [addUserOpen, setAddUserOpen] = useState<boolean>(false);

  const [dates, setDates] = useState<Date[]>([]);
  const [endDateRange, setEndDateRange] = useState<DateType>(null);
  const [startDateRange, setStartDateRange] = useState<DateType>(null);

  const tagList = useSelector((state: RootState) => state.tags.list);
  const botList = useSelector((state: RootState) => state.bots.list);

  const [selectedSRId, setSelectedSRId] = useState<any>('');
  const [takeItDialogOpen, setTakeItDialogOpen] = useState<boolean>(false);
  const [deferDialogOpen, setDeferDialogOpen] = useState<boolean>(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState<boolean>(false);
  const handleDeferDialog = (id: any) => {
    setSelectedSRId(id);
    setDeferDialogOpen(true);
  };
  const handleCloseDialog = (id: any) => {
    setSelectedSRId(id);
    setCloseDialogOpen(true);
  };
  const handleTakeItDialog = (id: any) => {
    setSelectedSRId(id);
    setTakeItDialogOpen(true);
  };

  const handleOnChangeRange = (dates: any) => {
    const [start, end] = dates;
    if (start !== null && end !== null) {
      setDates(dates);
    }
    setStartDateRange(start);
    setEndDateRange(end);
  };

  const handleBotChange = useCallback((e: SelectChangeEvent) => {
    setBot(e.target.value);
  }, []);

  const handleTagFilteredChange = useCallback(
    (e: SelectChangeEvent<typeof tagFiltered>) => {
      const {
        target: { value },
      } = e;
      // setTagFiltered(value);
      setTagFiltered(
        // On autofill we get a stringified value.
        typeof value === 'string' ? value.split(',') : value,
      );
    },
    [],
  );

  const handleStatusChange = useCallback((e: SelectChangeEvent) => {
    setStatus(e.target.value);
  }, []);
  
  const handlePriorityChange = useCallback((e: SelectChangeEvent) => {
    setPriority(e.target.value);
  }, []);

  // ** Hooks
  const dispatch = useDispatch<AppDispatch>();
  const store = useSelector((state: RootState) => state.serviceRequest);
  const { ticketStates } = useSelector((state: RootState) => state.states);

  const [ticketsListDataFiltered, setTicketsListDataFiltered] = useState<any>(
    [],
  );

  useEffect(() => {
    dispatch(gettag());
    dispatch(fetchBotData());
  }, []);
  useEffect(() => {
    dispatch(getTicketCardStates());
  }, [dispatch]);
  const [ticketCardData, setTicketCardData] = useState<any>([]);
  useEffect(() => {
    if (ticketStates && ticketStates.length > 0) {
      let mapArr = ticketStates.map((item: any) => {
        return {
          ...item,
          stats: item.stats.toString(),
          avatarIcon: item.title.toLowerCase().includes('total')
            ? "/images/new/service-requests/TOTAL.png"
            : item.title.toLowerCase().includes('open')
            ? "/images/new/service-requests/SPEECH.png"
            : item.title.toLowerCase().includes('closed')
            ? "/images/new/service-requests/CLOSED.png"
            : item.title.toLowerCase().includes('critical')
            ? "/images/new/service-requests/CRITICAL.png"
            : 'ic:baseline-question-mark',
          avatarColor:
            item.title.toLowerCase().includes('open') 
              ? 'warning'
              : item.title.toLowerCase().includes('closed') 
              ? 'success'
              : item.title.toLowerCase().includes('critical')
              ? 'error'
              : 'primary',
        };
      });
      setTicketCardData(mapArr)
    }
  }, [ticketStates]);

  useEffect(() => {
    dispatch(
      fetchAllTicketsData({
        bot:bot,
        tags:tagFiltered,
        priority:priority,
        status:status,
        startDate: startDateRange,
        endDate: endDateRange,
      })
    );
  }, [bot, tagFiltered, priority, status, startDateRange, endDateRange]);

  useEffect(() => {
    if (value && value.trim() !== '') {
      let queryLowered = value.toLowerCase();
      const filteredData = store?.ticketList?.filter(
        (item: any) =>
          item.subject.toLowerCase().includes(queryLowered)
      );
      setTicketsListDataFiltered(filteredData);
    } else {
      setTicketsListDataFiltered(store?.ticketList);
    }
  }, [value, store?.ticketList]);

  const handleFilter = useCallback((val: string) => {
    setValue(val);
  }, []);

  const toggleAddUserDrawer = () => setAddUserOpen(!addUserOpen);

  const columns = [
    // {
    //   maxWidth: 70,
    //   field: 'id' , 
    //   headerName: 'Sr.No', 
    //   filterable: false,
    //   headerClassName : "custom-header",
    //   renderCell:(index:any) => {
    //     return (
    //       <div style={{ textAlign: 'center',width:'100%' }}>{index.api.getRowIndex(index?.row?._id || index?.row?.id)+1}</div>
    //     );}
    // },
    // {
    //   flex: 1,
    //   minWidth: 140,
    //   field: 'ticketId',
    //   headerName: 'id',
    //   renderCell: ({ row }: any) => {
    //     return (
    //       <>
    //         <Link href={`/service-request/view/${row?._id || row?.id}`}>
    //           <StyledLink>{row.ticketId}</StyledLink>
    //         </Link>
    //       </>
    //     )
    //   }
    // },
    {
      flex: 1,
      minWidth: 140,
      field: 'subject',
      headerName: 'subject',
      headerClassName : "custom-header",
      renderCell: ({ row }: any) => {
        return (
          <>
            <Link href={`/service-request/view/${row?._id || row?.id}`}>
              <StyledLink>{row.subject}</StyledLink>
            </Link>
          </>
        )
      }
    },
    {
      flex: 1,
      minWidth: 100,
      field: 'bot',
      headerName: 'Bot',
      headerClassName : "custom-header",
      renderCell: ({ row }: any) => {
        return <span>{row?.bot?.name}</span>;
      },
    },
    {
      flex: 0.1,
      minWidth: 140,
      field: 'status',
      headerName: 'Status',
      headerClassName : "custom-header",
      renderCell: ({ row }: any) => {
        return (
          <CustomChip
            rounded
            skin="light"
            size="small"
            label={row.status}
            color={serviceRequestObj[row.status?.toLowerCase()]}
          />
        );
      },
    },
    {
      flex: 1,
      minWidth: 180,
      field: 'phone',
      headerName: 'Phone & EmailId',
      headerClassName : "custom-header",
      renderCell: ({ row }: any) => {
      const { _id, visitor } = row;

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
                  {visitor?.phone}
              </Typography>
              <Typography
                  noWrap
                  variant="caption"
                  sx={{ color: 'text.disabled' }}
              >
                  {visitor?.email}
              </Typography>
          </Box>
          </Box>
      );
      },
    },
    {
      flex: 0.1,
      minWidth: 120,
      field: 'priority',
      headerName: 'Priority',
      headerClassName : "custom-header",
      renderCell: ({ row }: any) => {
        return (
          <CustomChip
            rounded
            skin="light"
            size="small"
            label={row.priority}
            color={serviceRequestObj[row.priority?.toLowerCase()]}
          />
        );
      },
    },
    {
      flex:1,
      minWidth: 160,
      field: 'updatedAt',
      headerName: 'Last update',
      headerClassName : "custom-header",
      renderCell: ({ row }: any) => {
        return (
          <span>
            {new Date(row.updatedAt).toLocaleDateString('en-US', {
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
      flex: 1,
      minWidth: 180,
      sortable: false,
      field: 'actions',
      headerName: 'Actions',
      headerClassName : "custom-header",
      renderCell: ({ row }: any) => {
        return (
          <>
            <Tooltip placement="top" title={row?.agents?.length<=1 ?"Assign me":"Already assigned"} arrow>
              <IconButton
                aria-label="Take it"
                size="small"
                sx={{ mr: 2 }}
                color="primary"
                disabled={
                  ['CLOSED','RESOLVED'].includes(row?.status) ?
                    true
                  : (row?.agents?.length<=1) ? false : true
                }
                onClick={() => handleTakeItDialog(row?._id || row?.id)}
              >
                <Icon icon={"ooui:flag-ltr"} fontSize={20} />
              </IconButton>
            </Tooltip>

            <Link href={`/service-request/view/${row?._id || row?.id}`}>
              <Tooltip placement="top" title="View Ticket" arrow>
                <IconButton aria-label="View" size="small" sx={{ mr: 2 }} color="secondary">
                  <Icon icon="bx:show" fontSize={20} />
                </IconButton>
              </Tooltip>
            </Link>

          
            <Tooltip placement="top" title="Mark Defer" arrow>
              <IconButton
                aria-label="Defer"
                size="small"
                sx={{ mr: 2 }}
                disabled={['DEFERRED','CLOSED','RESOLVED'].includes(row?.status)}
                color="error"
                onClick={() => handleDeferDialog(row?._id || row?.id)}
              >
                <Icon icon="material-symbols:disabled-by-default-rounded" fontSize={20} />
              </IconButton>
            </Tooltip>

            <Tooltip placement="top" title="Mark Resolved" arrow>
              <IconButton
                aria-label="Close"
                size="small"
                sx={{ mr: 2 }}
                color="success"
                disabled={['CLOSED','RESOLVED'].includes(row?.status)}
                onClick={() => handleCloseDialog(row?._id || row?.id)}
              >
                <Icon icon="charm:tick-double" fontSize={20} />
              </IconButton>
            </Tooltip>
          </>
        );
      },
    },
  ];

  return (
    <DatePickerWrapper>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          {ticketCardData && (
            <Grid container spacing={6} justifyContent="center">
              {ticketCardData.map((item: CardStatsHorizontalProps, index: number) => {
                return (
                  <Grid 
                    key={index}
                    item 
                    xs={12} 
                    md={3} 
                    sm={6}
                    // sm="auto"
                  >
                    <CardStatisticsHorizontal {...item} />
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Grid>
        <Grid item xs={12}>
          <Card sx={{boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'}}  >
            <TableHeader
              value={value}
              handleFilter={handleFilter}
              toggle={toggleAddUserDrawer}
            />
            <Divider sx={{ m: '0 !important' }} />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item sm={12} xs={12}>
                  <div style={{ fontSize: '1.1rem' }}>Filters</div>
                </Grid>

                <Grid item sm={2} xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="bot-select">Select Bot</InputLabel>
                    <Select
                      fullWidth
                      value={bot}
                      size="small"
                      id="select-bot"
                      label="Select Bot"
                      labelId="bot-select"
                      onChange={handleBotChange}
                      inputProps={{ placeholder: 'Select Bot' }}
                      MenuProps={MenuProps}
                    >
                      <MenuItem value="">All</MenuItem>
                      {botList?.map((bot: any, index) => (
                        <MenuItem key={index} value={bot?._id || bot?.id}>
                          {bot?.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item sm={3} xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="tag-select">Select Tag</InputLabel>
                    <Select
                      fullWidth
                      value={tagFiltered}
                      id="select-tag"
                      size="small"
                      multiple
                      label="Select Tag"
                      labelId="tag-select"
                      onChange={handleTagFilteredChange}
                      input={
                        <OutlinedInput
                          id="select-multiple-tag"
                          label="Select Tag"
                        />
                      }
                      inputProps={{ placeholder: 'Select Tags' }}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {selected.map((value: any) => {
                            let obj = tagList.find((x) => x._id === value);
                            return (
                              <Chip
                                key={value}
                                label={obj?.name}
                                color="primary"
                                size="small"
                                sx={{ margin: '1.2px', fontSize: '9px' }}
                              />
                            );
                          })}
                        </Box>
                      )}
                      MenuProps={MenuProps}
                    >
                      {tagList?.map((tag: any, index) => (
                        <MenuItem key={index} value={tag?._id || tag?.id}>
                          {tag?.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item sm={3} xs={12}>
                  <DatePicker
                    isClearable
                    selectsRange
                    // size='small'
                    monthsShown={2}
                    endDate={endDateRange}
                    selected={startDateRange}
                    startDate={startDateRange}
                    shouldCloseOnSelect={false}
                    id="date-range-picker-months"
                    onChange={handleOnChangeRange}
                    customInput={
                      <CustomInput
                        dates={dates}
                        setDates={setDates}
                        label="Select Date Range"
                        // size='small'
                        end={endDateRange as number | Date}
                        start={startDateRange as number | Date}
                      />
                    }
                  />
                </Grid>

                <Grid item sm={2} xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="priority-select">Select Priority</InputLabel>
                    <Select
                      fullWidth
                      value={priority}
                      size="small"
                      id="select-priority"
                      label="Select Priority"
                      labelId="priority-select"
                      onChange={handlePriorityChange}
                      inputProps={{ placeholder: 'Select Priority' }}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="LOW">Low</MenuItem>
                      <MenuItem value="MEDIUM">Medium</MenuItem>
                      <MenuItem value="HIGH">High</MenuItem>
                      <MenuItem value="CRITICAL">Critical</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item sm={2} xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="status-select">Select Status</InputLabel>
                    <Select
                      fullWidth
                      value={status}
                      size="small"
                      id="select-status"
                      label="Select Status"
                      labelId="status-select"
                      onChange={handleStatusChange}
                      inputProps={{ placeholder: 'Select Status' }}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="OPEN">Open</MenuItem>
                      <MenuItem value="PENDING">Pending</MenuItem>
                      <MenuItem value="DEFERRED">Deferred</MenuItem>
                      <MenuItem value="CLOSED">Closed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>

            <DataGrid
              autoHeight
              rows={ticketsListDataFiltered ?? []}
              columns={columns}
              getRowId={(row: any) => row?._id || row?.id}
              pageSize={pageSize}
              disableSelectionOnClick
              rowsPerPageOptions={[10, 25, 50]}
              onPageSizeChange={(newPageSize: number) => setPageSize(newPageSize)}
            />
          </Card>
        </Grid>

        <AddUserDrawer open={addUserOpen} toggle={toggleAddUserDrawer} />
        
        <SRAssignDialog
          ticketId={selectedSRId}
          open={takeItDialogOpen}
          setOpen={setTakeItDialogOpen}
        />
        <SRDeferDialog
          ticketId={selectedSRId}
          open={deferDialogOpen}
          setOpen={setDeferDialogOpen}
        />
        <SRCloseDialog
          ticketId={selectedSRId}
          open={closeDialogOpen}
          setOpen={setCloseDialogOpen}
        />
      </Grid>
    </DatePickerWrapper>
  );
};


export default UserList;
