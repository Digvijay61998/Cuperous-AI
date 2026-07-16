import { useEffect, useState, forwardRef } from 'react';
// ** MUI Imports
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import DatePicker from 'react-datepicker';
import Grid from '@mui/material/Grid';
import format from 'date-fns/format';
import { DateType } from 'src/types/forms/reactDatepickerTypes';
import InputAdornment from '@mui/material/InputAdornment';
import Icon from 'src/@core/components/icon';
import { Stack, Typography } from '@mui/material';
// ** Third Party Imports
import { Bar } from 'react-chartjs-2';
import { ChartData, ChartOptions } from 'chart.js';
import MenuAndDateRangeComp from './common-component/menu-and-date-range';

interface Props {
  info: string;
  warning: string;
  labelColor: string;
  borderColor: string;
  legendColor: string;
  lineChartYellow: string;
  lineChartPrimary: string;
  lineChartWarning: string;
  labels: any;
  total: any;
  facebook: any;
  telegram: any;
  whatsapp: any;
  widget: any;
  xLabelText: string;
  yLabelText: string;
  titleText: string;
  barTitle: any[];
  componentTitle?: string;
  inputFieldLabel?: string;
  menuList?: any[];
  startDate?: any;
  endDate?: any;
  setEndDate?: any;
  setStartDate?: any;
  handleOnChange?: any;
  id?: any;
  setId?: any;
}

const Report = (props: Props) => {
  // ** Props
  const {
    info,
    warning,
    labelColor,
    borderColor,
    legendColor,
    lineChartYellow,
    lineChartPrimary,
    lineChartWarning,
    labels,
    total,
    facebook,
    telegram,
    whatsapp,
    widget,
    xLabelText,
    yLabelText,
    titleText,
    barTitle,
    inputFieldLabel,
    menuList,
    componentTitle,
    endDate,
    startDate,
    setEndDate,
    setStartDate,
    handleOnChange,
    id,
    setId,
  } = props;

  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500 },
    elements: {
      bar: {
        borderRadius: {
          topRight: 15,
          bottomRight: 15,
        },
      },
    },
    layout: {
      padding: { top: -4 },
    },
    scales: {
      x: {
        min: 0,
        grid: {
          drawTicks: false,
          drawBorder: false,
          color: borderColor,
        },
        ticks: { color: labelColor },
        title: {
          display: true,
          text: xLabelText,
          font: {
            size: 16,
          },
        },
      },
      y: {
        grid: {
          borderColor,
          display: false,
          drawBorder: false,
        },
        ticks: { color: labelColor },
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
        align: 'end',
        position: 'top',
        labels: { color: legendColor },
      },
    },
  };

  const data: ChartData<'bar'> = {
    labels: labels,
    datasets: [
      {
        maxBarThickness: 15,
        label: barTitle[0],
        backgroundColor: warning,
        borderColor: 'transparent',
        data: total,
      },
      {
        maxBarThickness: 15,
        backgroundColor: info,
        label: barTitle[1],
        borderColor: 'transparent',
        data: facebook,
      },
      {
        maxBarThickness: 15,
        backgroundColor: lineChartPrimary,
        label: barTitle[2],
        borderColor: 'transparent',
        data: telegram,
      },
      {
        maxBarThickness: 15,
        backgroundColor: lineChartWarning,
        label: barTitle[3],
        borderColor: 'transparent',
        data: whatsapp,
      },
      {
        maxBarThickness: 15,
        backgroundColor: lineChartYellow,
        label: barTitle[4],
        borderColor: 'transparent',
        data: widget,
      },
    ],
  };


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
           <MenuAndDateRangeComp 
           id={id}
           setId={setId}
           inputFieldLabel={inputFieldLabel}
           startDate={startDate}
           endDate={endDate}
           handleOnChange={handleOnChange}
           menuList={menuList}
           />
          </>
        }
      />
      {/* <CardHeader
        title="Bot Performance"
        action={
          <TextField
            size="small"
            fullWidth
            select
            label="Bots"
            defaultValue=""
            id="form-layouts-collapsible-select"
          >
            <MenuItem value="Right">Right</MenuItem>
            <MenuItem value="Left">Left</MenuItem>
          </TextField>
        }
      /> */}
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

export default Report;
