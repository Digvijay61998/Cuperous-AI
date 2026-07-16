// ** React Imports
import { MouseEvent, useEffect, useState } from 'react';

// ** MUI Import
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Menu from '@mui/material/Menu';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import Grid, { GridProps } from '@mui/material/Grid';
import { styled, useTheme } from '@mui/material/styles';

// ** Icons Imports
import Icon from 'src/@core/components/icon';

// ** Third Party Imports
import { ApexOptions } from 'apexcharts';

// ** Custom Components Imports
import CustomAvatar from 'src/@core/components/mui/avatar';
import ReactApexcharts from 'src/@core/components/react-apexcharts';

// ** Hook Import
import { useSettings } from 'src/@core/hooks/useSettings';

// ** Util Import
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba';
import Tooltip from '@mui/material/Tooltip';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from 'src/store';
import { getVisitorSummaryReport } from 'src/store/apps/dashboard';

const yearOptions = [
  new Date().getFullYear() - 1,
  new Date().getFullYear() - 2,
  new Date().getFullYear() - 3,
];

const series = [
  { name: `${new Date().getFullYear() - 1}`, data: [18, 7, 15, 29, 18, 12] },
];

const StyledGrid = styled(Grid)<GridProps>(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  [theme.breakpoints.up('sm')]: {
    borderRight: `1px solid ${theme.palette.divider}`,
  },
}));

const monthsArr: any = {
  1: 'Jan',
  2: 'Feb',
  3: 'Mar',
  4: 'Apr',
  5: 'May',
  6: 'Jun',
  7: 'Jul',
  8: 'Aug',
  9: 'Sep',
  10: 'Oct',
  11: 'Nov',
  12: 'Dec',
};

const AnalyticsTotalRevenue = () => {
  // ** State
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // ** Hooks & Var
  const theme = useTheme();
  const { settings } = useSettings();
  const { direction } = settings;
  const { visitorsSummary } = useSelector(
    (state: RootState) => state.dashboard,
  );
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    if (dispatch) {
      dispatch(getVisitorSummaryReport());
    }
  }, [dispatch]);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const [monthWiseData, setMonthWiseData] = useState<any>({
    labels: [],
  });
  const [yearWiseData, setYearWiseData] = useState<any>({});
  type seriesType = {
    data: any[];
    name: string;
  };
  const [seriesData, setSeriesData] = useState<any>({
    data: [],
    name: `${new Date().getFullYear()}`,
  });
  const [yearsData, setYearsData] = useState<any>([]);
  useEffect(() => {
    if (visitorsSummary?.chart && visitorsSummary?.chart?.length > 0) {
      let chartData: any = visitorsSummary?.chart;
      const mapData = chartData.map((item: any) => {
        if (monthsArr[item.month].length > 0) {
          return {
            name: monthsArr[item.month],
            data: item.count,
          };
        }
      });
      // separate name and data in array from mapData
      const nameArr = mapData.map((item: any) => item.name);
      const dataArr: number[] = mapData.map((item: any) => item.data);
      setMonthWiseData({
        labels: nameArr,
      });
      setSeriesData({
        ...seriesData,
        data: dataArr,
      });
    }
    if (visitorsSummary?.yearWise && visitorsSummary?.yearWise?.length > 0) {
      setYearsData(visitorsSummary.yearWise);
      let onlyCurrentYear = visitorsSummary.yearWise.filter(
        (item: any) => item.year === new Date().getFullYear(),
      );
    
      setYearWiseData(onlyCurrentYear[0]);
    }
  }, [visitorsSummary]);
  const handleClose = () => {
    setAnchorEl(null);
  };

  const barOptions: ApexOptions = {
    chart: {
      stacked: true,
      parentHeightOffset: 0,
      toolbar: { show: false },
    },
    dataLabels: { enabled: false },
    stroke: {
      width: 6,
      lineCap: 'round',
      colors: [theme.palette.background.paper],
    },
    colors: [
      // hexToRGBA(theme.palette.primary.main, 1),
      // hexToRGBA(theme.palette.info.main, 1),
      "#55B948"
    ],
    legend: {
      offsetX: -10,
      position: 'top',
      fontSize: '14px',
      horizontalAlign: 'left',
      fontFamily: theme.typography.fontFamily,
      labels: {
        colors: theme.palette.text.secondary,
      },
      itemMargin: {
        vertical: 4,
        horizontal: 10,
      },
      markers: {
        width: 8,
        height: 8,
        radius: 10,
        offsetX: -4,
      },
    },
    states: {
      hover: {
        filter: { type: 'none' },
      },
      active: {
        filter: { type: 'none' },
      },
    },
    grid: {
      borderColor: theme.palette.divider,
      padding: {
        bottom: 5,
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 10,
        columnWidth: '10%',
        // endingShape: 'rounded',
        // startingShape: 'rounded',
      },
    },
    xaxis: {
      axisTicks: { show: false },
      crosshairs: { opacity: 0 },
      axisBorder: { show: false },
      categories: monthWiseData?.labels,
      labels: {
        style: {
          fontSize: '14px',
          colors: theme.palette.text.disabled,
          fontFamily: theme.typography.fontFamily,
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '14px',
          colors: theme.palette.text.disabled,
          fontFamily: theme.typography.fontFamily,
        },
      },
    },
    responsive: [
      {
        breakpoint: theme.breakpoints.values.xl,
        options: {
          plotOptions: {
            bar: { columnWidth: '43%' },
          },
        },
      },
      {
        breakpoint: theme.breakpoints.values.lg,
        options: {
          plotOptions: {
            bar: { columnWidth: '30%' },
          },
        },
      },
      {
        breakpoint: theme.breakpoints.values.md,
        options: {
          plotOptions: {
            bar: { columnWidth: '42%' },
          },
        },
      },
      {
        breakpoint: theme.breakpoints.values.sm,
        options: {
          plotOptions: {
            bar: { columnWidth: '45%' },
          },
        },
      },
    ],
  };

  const radialBarOptions: ApexOptions = {
    chart: {
      sparkline: { enabled: true },
    },
    labels: ['Growth'],
    stroke: { dashArray: 5 },
    colors: [hexToRGBA(theme.palette.primary.main, 1)],
    states: {
      hover: {
        filter: { type: 'none' },
      },
      active: {
        filter: { type: 'none' },
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        opacityTo: 0.6,
        opacityFrom: 1,
        shadeIntensity: 0.5,
        stops: [30, 70, 100],
        inverseColors: false,
        gradientToColors: [theme.palette.primary.main],
      },
    },
    plotOptions: {
      radialBar: {
        endAngle: 150,
        startAngle: -140,
        hollow: { size: '55%' },
        track: { background: 'transparent' },
        dataLabels: {
          name: {
            offsetY: 25,
            fontWeight: 600,
            fontSize: '16px',
            color: theme.palette.text.secondary,
            fontFamily: theme.typography.fontFamily,
          },
          value: {
            offsetY: -15,
            fontWeight: 500,
            fontSize: '24px',
            color: theme.palette.text.primary,
            fontFamily: theme.typography.fontFamily,
          },
        },
      },
    },
    responsive: [
      {
        breakpoint: 900,
        options: {
          chart: { height: 200 },
        },
      },
      {
        breakpoint: 735,
        options: {
          chart: { height: 200 },
        },
      },
      {
        breakpoint: 660,
        options: {
          chart: { height: 200 },
        },
      },
      {
        breakpoint: 600,
        options: {
          chart: { height: 280 },
        },
      },
    ],
  };

  const handleSetYearWiseData = (data: any) => {
    setYearWiseData(data);
    setAnchorEl(null);
  }
  return (
    <Card sx={{boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'}} >
      <Grid container>
      <Grid item xs={12} sm={5} xl={4}>
      <CardContent sx={{ p: `${theme.spacing(5, 3, 0)} !important` }}>
            <Typography variant="h6">Total Monthly Visitors</Typography>
          </CardContent>
          <CardContent sx={{ p: `${theme.spacing(8, 6, 7.5)} !important` }}>
            <Box sx={{ textAlign: 'center' }}>
              <Button
                size="small"
                variant="outlined"
                aria-haspopup="true"
                onClick={handleClick}
                sx={{ '& svg': { ml: 0.5 } }}
              >
                {yearWiseData?.year}
                <Icon icon="bx:chevron-down" />
              </Button>
              <Menu
                keepMounted
                anchorEl={anchorEl}
                onClose={handleClose}
                open={Boolean(anchorEl)}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: direction === 'ltr' ? 'right' : 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: direction === 'ltr' ? 'right' : 'left',
                }}
              >
                {yearsData.map((item: any, index: number) => (
                  <MenuItem key={index} onClick={()=> handleSetYearWiseData(item)}>
                    {item?.year}
                  </MenuItem>
                ))}
              </Menu>
              <ReactApexcharts
                type="radialBar"
                height={200}
                series={[yearWiseData?.growth || 0]}
                options={radialBarOptions}
              />
              <Typography
                sx={{ mb: 7.5, fontWeight: 600, color: 'text.secondary' }}
              >
                {yearWiseData?.growth}% Visitors Growth
              </Typography>
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <Box sx={{ mr: 4, display: 'flex', alignItems: 'center' }}>
                <CustomAvatar
                  skin="light"
                  variant="rounded"
                  sx={{ mr: 2.5, width: 38, height: 38 }}
                >
                  <Icon icon="fluent:bot-24-filled" />
                </CustomAvatar>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Tooltip title="Handled By Bots" placement="top" arrow>
                    <Typography variant="body2">Bots</Typography>
                  </Tooltip>
                  <Typography sx={{ fontWeight: 500 }}>
                    {yearWiseData?.handledByBot}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CustomAvatar
                  skin="light"
                  color="info"
                  variant="rounded"
                  sx={{ mr: 2.5, width: 38, height: 38 }}
                >
                  <Icon icon="material-symbols:support-agent" />
                </CustomAvatar>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Tooltip title="Handled By Agent" placement="top" arrow>
                    <Typography variant="body2">Agent</Typography>
                  </Tooltip>
                  <Typography sx={{ fontWeight: 500 }}>
                    {yearWiseData?.handledByAgent}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Grid>
        <StyledGrid
          item
          sm={7}
          xl={8}
          xs={12}
          sx={{
            '& .apexcharts-series[rel="2"]': { transform: 'translateY(-10px)' },
          }}
        >
          <CardContent sx={{ p: `${theme.spacing(5, 3, 0)} !important`, height : "70px" }}>
            {/* <Typography variant="h6">Total Monthly Visitors</Typography> */}
          </CardContent>
          {monthWiseData?.labels.length > 0 && (
            <ReactApexcharts
              type="bar"
              height={312}
              options={barOptions}
              series={[seriesData]}
            />
          )}
        </StyledGrid>
      </Grid>
    </Card>
  );
};

export default AnalyticsTotalRevenue;
