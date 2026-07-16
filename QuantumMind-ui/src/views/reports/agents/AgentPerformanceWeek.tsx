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

const AgentPerformanceWeek = (props: HorizontalBarProps) => {
  // ** Props
  const {
    info,
    warning,
    labelColor,
    borderColor,
    legendColor,
    data: reportData,
  } = props;
  const [dayWiseData, setDayWiseData] = useState<any>({
    days: [],
    total: [],
    completed: [],
    expired: [],
  });

  useEffect(() => {
    if (reportData && reportData?.length > 0) {
      const days = reportData.map((item: any) => item.day);
      const total = reportData.map((item: any) => item.total);
      const completed = reportData.map((item: any) => item.completed);
      const expired = reportData.map((item: any) => item.expired);
      setDayWiseData({
        days,
        total,
        completed,
        expired,
      });
    }
  }, [reportData]);
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
        ticks: { color: labelColor, stepSize: 1 },
        beginAtZero: true,
        title: {
          display: true,
          text: 'Conversations count',
          font: {
            size: 16,
          
          }
        }
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
          text: 'Days',
          font: {
            size: 16,
          
          }
        }
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
    labels: dayWiseData.days,
    datasets: [
      {
        maxBarThickness: 15,
        label: 'Total',
        backgroundColor: warning,
        borderColor: 'transparent',
        data: dayWiseData.total,
      },
      {
        maxBarThickness: 15,
        backgroundColor: info,
        label: 'Completed',
        borderColor: 'transparent',
        data: dayWiseData.completed,
      },
      {
        maxBarThickness: 15,
        backgroundColor: legendColor,
        label: 'Expired',
        borderColor: 'transparent',
        data: dayWiseData.expired,
      },
    ],
  };

  return (
    <Card>
      {/* <CardHeader
        title="Agent Performance"
        action={
          <TextField
            size="small"
            fullWidth
            select
            label="Agents"
            defaultValue=""
            id="form-layouts-collapsible-select"
          >
            <MenuItem value="Right">Right</MenuItem>
            <MenuItem value="Left">Left</MenuItem>
          </TextField>
        }
      /> */}
      <CardContent>
        {dayWiseData && dayWiseData.days.length > 0 && (
          <Bar data={data} height={400} options={options} />
        )}
      </CardContent>
    </Card>
  );
};

export default AgentPerformanceWeek;
