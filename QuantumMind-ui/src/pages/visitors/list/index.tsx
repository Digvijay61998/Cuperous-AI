// ** React Imports
import {
  forwardRef, useCallback,
  useEffect,
  useState
} from 'react';

// ** Next Import

// ** MUI Imports
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import TextField from '@mui/material/TextField';

// ** Icon Imports

// ** Store Imports
import { useDispatch, useSelector } from 'react-redux';

// ** Custom Components Imports
import CardStatisticsHorizontal from 'src/@core/components/card-statistics/card-stats-horizontal';

// ** Utils Import

// ** Actions Imports

// ** Third Party Components

// ** Types Imports
import { CardStatsHorizontalProps } from 'src/@core/components/card-statistics/types';
import { ThemeColor } from 'src/@core/layouts/types';
import { AppDispatch, RootState } from 'src/store';

// ** Custom Table Components Imports
import AddUserDrawer from 'src/views/visitors/list/AddUserDrawer';
import TableHeader from 'src/views/visitors/list/TableHeader';

import format from 'date-fns/format';
import DatePicker from 'react-datepicker';
import { DateType } from 'src/types/forms/reactDatepickerTypes';

// ** Styled Components
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker';
import { getVisitorCardStates } from 'src/store/apps/states';
import { getvisitor } from 'src/store/apps/visitor';
import VisitorList from 'src/views/visitors/list/VisitorsDataGrid';

interface UserRoleType {
  [key: string]: { icon: string; color: string };
}

interface UserStatusType {
  [key: string]: ThemeColor;
}

interface Props {
  dates: Date[];
  label: string;
  end: number | Date;
  start: number | Date;
  setDates?: (value: Date[]) => void;
}

// ** Vars

/* eslint-disable */
const CustomInput = forwardRef((props: Props, ref) => {
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
/* eslint-enable */

const avatarIcon: any = {
  total_visitors: 'mdi:user-group',
  handled_by_bot: 'bx:bot',
  handled_by_agent: 'bx:user-voice',
  blocked_visitors: 'bx:block',
  live_visitors: 'bx:user-plus',
};
const UserList = () => {
  // ** State
  const [bot, setBot] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const dispatch = useDispatch<AppDispatch>();
  const [addUserOpen, setAddUserOpen] = useState<boolean>(false);
  const [dates, setDates] = useState<Date[]>([]);
  const [endDateRange, setEndDateRange] = useState<DateType>(null);
  const [startDateRange, setStartDateRange] = useState<DateType>(null);
  const { visitorStates } = useSelector((state: RootState) => state.states);
  const [visitorCardData, setVisitorCardData] = useState<any>([]);
  useEffect(() => {
    if (dispatch) dispatch(getVisitorCardStates());
  }, [dispatch]);
  useEffect(() => {
    if (visitorStates && visitorStates.length > 0) {
      let mapArr = visitorStates.map((item: any) => {
        return {
          ...item,
          stats: item.stats.toString(),
          avatarIcon: item.title.toLowerCase().includes('total')
            ? '/images/new/visitors/TOTAL_VISITORS.png'
            : item.title.toLowerCase().includes('bot')
            ? '/images/new/visitors/HADELED_BY_BOTS.png'
            : item.title.toLowerCase().includes('agent')
            ? '/images/new/visitors/HANDELED_BY_AGENTS.png'
            : item.title.toLowerCase().includes('blocked')
            ? avatarIcon.blocked_visitors
            : item.title.toLowerCase().includes('active')
            ? '/images/new/visitors/ACTIVE_VISITORS.png' 
            : 'mdi:user',
          avatarColor: item.title.toLowerCase().includes('agent')
            ? 'warning'
            : item.title.toLowerCase().includes('bot')
            ? 'success'
            : 'primary',
        };
      });
      setVisitorCardData(mapArr);
    }
  }, [visitorStates]);

  const handleOnChangeRange = (dates: any) => {
    const [start, end] = dates;
    if (start !== null && end !== null) {
      setDates(dates);
    }
    setStartDateRange(start);
    setEndDateRange(end);
  };

  // ** Hooks
  const handleFilter = useCallback((val: string) => {
    setValue(val);
  }, []);

  const handleBotChange = useCallback((e: SelectChangeEvent) => {
    setBot(e.target.value);
  }, []);

  const handleStatusChange = useCallback((e: SelectChangeEvent) => {
    setStatus(e.target.value);
  }, []);

  const toggleAddUserDrawer = () => setAddUserOpen(!addUserOpen);

  // ** Hooks
  const visitorList: any = useSelector((state: RootState) => state.visitors);

  // const [visitorListDataFiltered, setVisitorListDataFiltered] = useState<any>(
  //   [],
  // );

  useEffect(() => {
    if (pageSize) {
      setIsLoading(true);
      dispatch(
        getvisitor({
          skip:page*pageSize,
          limit:pageSize,
          search: value,
          bot,
          status,
          startDate: startDateRange,
          endDate: endDateRange,
        }),
      );
      setIsLoading(false);
    }
  }, [value, page, pageSize, bot, status, startDateRange, endDateRange]);

  // useEffect(() => {
  //   if (value && value.trim() !== '') {
  //     let queryLowered = value.toLowerCase();
  //     const filteredData = visitorList?.list?.filter(
  //       (item: any) =>
  //         item.name.toLowerCase().includes(queryLowered) ||
  //         item.email.toLowerCase().includes(queryLowered) ||
  //         item.phone.toLowerCase().includes(queryLowered),
  //     );
  //     setVisitorListDataFiltered(filteredData);
  //   } else {
  //     setVisitorListDataFiltered(visitorList?.list);
  //   }
  // }, [value, visitorList?.list]);

  return (
    <DatePickerWrapper>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          {visitorCardData && (
            <Grid container spacing={6}>
              {visitorCardData.map(
                (item: CardStatsHorizontalProps, index: number) => {
                  return (
                    <Grid
                      item
                      xs={12}
                      md={3}
                      sm={4}
                      key={index}
                    >
                      <CardStatisticsHorizontal {...item} />
                    </Grid>
                  );
                },
              )}
            </Grid>
          )}
        </Grid>
        <Grid item xs={12}>
          <Card style={{boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'}} >
            <TableHeader
              value={value}
              handleFilter={handleFilter}
            />
            <Divider sx={{ m: '0 !important' }} />
            <CardContent>
              <Grid container spacing={5}>
                <Grid item sm={3} xs={12}>
                  <div style={{ fontSize: '1.1rem' }}>Filters</div>
                </Grid>
                <Grid item sm={3} xs={12}>
                  <FormControl fullWidth size="small"  >
                    <InputLabel id="role-select" >Select Bot</InputLabel>
                    <Select
                      fullWidth
                      size="small"
                      value={bot}
                      id="select-role"
                      label="Select Role"
                      labelId="role-select"
                      onChange={handleBotChange}
                      
                      inputProps={{ placeholder: 'Select Role' }}
                    >
                     <div  style={{height:"20rem", overflowY:"auto"}}>
                     <MenuItem value="">All</MenuItem>
                      {visitorList.search.bots?.map(
                        (bot: any, index: number) => (
                          <MenuItem  key={index} value={bot?._id || bot?.id}>
                            {bot?.name}
                          </MenuItem>
                        ),
                      )}
                     </div>
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
                <Grid item sm={3} xs={12}>
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
                      <MenuItem value="closed">Closed</MenuItem>
                      <MenuItem value="blocked">Blocked</MenuItem>
                      <MenuItem value="bot">Live With Bot</MenuItem>
                      <MenuItem value="agent">Live With Agent</MenuItem>
                      {/* {visitorList.search.status?.map((stx: any, index:number) => (
                        <MenuItem key={index} value={stx}>
                          {stx}
                        </MenuItem>
                      ))} */}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>

            <VisitorList 
              visitorListDataFiltered={visitorList?.list} 
              isLoading={isLoading} 
              rowCountState={visitorList?.listCount || visitorList?.list?.length} 
              page={page}
              setPage={setPage} 
              pageSize={pageSize}
              setPageSize={setPageSize}
              rowsPerPageOptions={[10, 20, 30]}
            />
          </Card>
        </Grid>

        <AddUserDrawer open={addUserOpen} toggle={toggleAddUserDrawer} />
      </Grid>
    </DatePickerWrapper>
  );
};


export default UserList;
