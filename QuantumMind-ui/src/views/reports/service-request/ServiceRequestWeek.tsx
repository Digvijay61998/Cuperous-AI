import { useEffect, useState } from 'react';

// ** MUI Imports
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

// ** Third Party Imports
import { Bar } from 'react-chartjs-2';
import { ChartData, ChartOptions } from 'chart.js';

interface HorizontalBarProps {
  info: string;
  warning: string;
  labelColor: string;
  borderColor: string;
  legendColor: string;
  data: any;
}

const ServiceRequestWeek = (props: HorizontalBarProps) => {
  // ** Props
  const {
    info,
    warning,
    labelColor,
    borderColor,
    legendColor,
    data: reportData,
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
      },
      y: {
        grid: {
          borderColor,
          display: false,
          drawBorder: false,
        },
        ticks: { color: labelColor },
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
    labels: ['MON', 'TUE', 'WED', 'THR', 'FRI'],
    datasets: [
      {
        maxBarThickness: 15,
        label: 'Total',
        backgroundColor: warning,
        borderColor: 'transparent',
        data: [710, 350, 550, 460, 120],
      },
      {
        maxBarThickness: 15,
        backgroundColor: info,
        label: 'Completed',
        borderColor: 'transparent',
        data: [430, 200, 510, 200, 100],
      },
      {
        maxBarThickness: 15,
        backgroundColor: legendColor,
        label: 'Pending',
        borderColor: 'transparent',
        data: [400, 150, 40, 160, 20],
      },
    ],
  };

  return (
    <Card>
      <CardHeader
        title="Service Request Performance By Bots"
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
      />
      <CardContent>
        <Bar data={data} height={400} options={options} />
      </CardContent>
    </Card>
  );
};

export default ServiceRequestWeek;
