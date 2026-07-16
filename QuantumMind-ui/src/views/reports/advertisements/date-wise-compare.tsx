// ** React Imports
import { forwardRef, useState, useEffect } from 'react';

// ** MUI Imports
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';

// ** Third Party Imports
import format from 'date-fns/format';
import { Bar } from 'react-chartjs-2';
import DatePicker from 'react-datepicker';
import { ChartData, ChartOptions } from 'chart.js';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Types
import { DateType } from 'src/types/forms/reactDatepickerTypes';
import { Stack, Typography } from '@mui/material';
import MenuTwoAndDateRangeComp from './menu-two-and-date-range';
interface BarProp {
  yellow: string;
  labelColor: string;
  borderColor: string;
  ads1: any;
  ads2: any;
  xLabelText: string;
  yLabelText: string;
  titleText: string;
  labels: any;
  barTitle: any[];
  inputFieldLabel?: string;
  componentTitle?: string;
  barColorsArr?: any[];
  menuList?: any[];
  startDate?: any;
  endDate?: any;
  setEndDate?: any;
  setStartDate?: any;
  handleOnChange?: any;
  compareId?: any;
  setCompareId?: any;
  compareId2?: any;
  setCompareId2?: any;
}

const DateWiseCompareReport = (props: BarProp) => {
  // ** Props
  const {
    yellow,
    labelColor,
    borderColor,
    ads1,
    ads2,
    xLabelText,
    yLabelText,
    titleText,
    labels,
    barTitle,
    inputFieldLabel,
    menuList,
    componentTitle,
    barColorsArr,
    endDate,
    startDate,
    setEndDate,
    setStartDate,
    handleOnChange,
    compareId,
    setCompareId,
    compareId2,
    setCompareId2,
  } = props;


  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1000 },
    scales: {
      x: {
        grid: {
          borderColor,
          drawBorder: false,
          color: borderColor,
        },
        ticks: { color: labelColor },
        title: {
          display: true,
          text: xLabelText,
          font: {
            size: 18,
          },
        },
      },
      y: {
        min: 0,

        grid: {
          borderColor,
          drawBorder: false,
          color: borderColor,
        },
        ticks: {
          stepSize: 100,
          color: labelColor,
        },
        title: {
          display: true,
          text: yLabelText,
          font: {
            size: 16,
          },
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        align: 'end',
        position: 'top',
        labels: { color: labelColor },
      },
    },
  };

  const data: ChartData<'bar'> = {
    labels: labels,
    datasets: [
      {
        maxBarThickness: 15,
        label: barTitle[0],
        backgroundColor: (barColorsArr && barColorsArr[0]) || '#826bf8',
        borderColor: 'transparent',
        borderRadius: { topRight: 15, topLeft: 15 },
        data: ads1,
      },
      {
        maxBarThickness: 15,
        label: barTitle[1],
        backgroundColor: (barColorsArr && barColorsArr[1]) || '#26c6da',
        borderColor: 'transparent',
        borderRadius: { topRight: 15, topLeft: 15 },
        data: ads2,
      },
    ],
  };

  const CustomInput = forwardRef(({ ...props }: any, ref) => {
    const startDate = format(props.start, 'MM/dd/yyyy');
    const endDate =
      props.end !== null ? ` - ${format(props.end, 'MM/dd/yyyy')}` : null;

    const value = `${startDate}${endDate !== null ? endDate : ''}`;

    return (
      <TextField
        {...props}
        size="small"
        value={value}
        inputRef={ref}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Icon icon="bx:calendar-alt" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <Icon icon="bx:chevron-down" />
            </InputAdornment>
          ),
        }}
      />
    );
  });


  return (
    <Card  sx={{
      boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'
    }}>
      <CardHeader
        title={titleText}
        sx={{
          flexDirection: ['column', 'row'],
          alignItems: ['flex-start', 'center'],
          '& .MuiCardHeader-action': { mb: 0 },
          '& .MuiCardHeader-content': { mb: [2, 0] },
        }}
        action={
          <>
           <MenuTwoAndDateRangeComp
            compareId={compareId}
            setCompareId={setCompareId}
            compareId2={compareId2}
            setCompareId2={setCompareId2}
            inputFieldLabel={inputFieldLabel}
            startDate={startDate}
            endDate={endDate}
            handleOnChange={handleOnChange}
            menuList={menuList}
           />
          </>
        }
      />
      <CardContent>
        {labels && labels.length > 0 ? (
          <Bar data={data} height={400} options={options} />
        ) : (
          <Stack height={400} justifyContent="center" alignItems="center">
            <Typography sx={{ textAlign: 'center' }}>No Data Found</Typography>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default DateWiseCompareReport;
