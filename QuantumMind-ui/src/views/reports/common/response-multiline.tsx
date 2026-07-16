// ** React Imports
import { forwardRef, useState } from 'react';

// ** MUI Imports
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Third Party Imports
import { ChartData, ChartOptions } from 'chart.js';
import format from 'date-fns/format';
import { Line } from 'react-chartjs-2';
import DatePicker from 'react-datepicker';

// ** Types
import { DateType } from 'src/types/forms/reactDatepickerTypes';

interface LineProps {
  white: string;
  warning: string;
  primary: string;
  success: string;
  labelColor: string;
  borderColor: string;
  legendColor: string;
  labels: any;
  botsData: any;
  agentData: any
}

const ResponseTimeChart = (props: LineProps) => {
  // ** Props
  const {
    white,
    primary,
    success,
    warning,
    labelColor,
    borderColor,
    legendColor,
    labels,
    botsData,
    agentData
  } = props;

  // ** States
  const [endDate, setEndDate] = useState<DateType>(null);
  const [startDate, setStartDate] = useState<DateType>(new Date());

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: labelColor },
        grid: {
          borderColor,
          drawBorder: false,
          color: borderColor,
        },
      },
      y: {
        min: 0,
        max: 400,
        ticks: {
          stepSize: 100,
          color: labelColor,
        },
        grid: {
          borderColor,
          drawBorder: false,
          color: borderColor,
        },
      },
    },
    plugins: {
      legend: {
        align: 'end',
        position: 'top',
        labels: {
          padding: 25,
          boxWidth: 10,
          color: legendColor,
          usePointStyle: true,
        },
      },
    },
  };

  const data: ChartData<'line'> = {
    labels: labels,
    datasets: [
      {
        fill: false,
        tension: 0.5,
        pointRadius: 1,
        label: 'Bot',
        pointHoverRadius: 5,
        pointStyle: 'circle',
        borderColor: primary,
        backgroundColor: primary,
        pointHoverBorderWidth: 5,
        pointHoverBorderColor: white,
        pointBorderColor: 'transparent',
        pointHoverBackgroundColor: primary,
        data: botsData,
      },
      {
        fill: false,
        tension: 0.5,
        label: 'Agent',
        pointRadius: 1,
        pointHoverRadius: 5,
        pointStyle: 'circle',
        borderColor: warning,
        backgroundColor: warning,
        pointHoverBorderWidth: 5,
        pointHoverBorderColor: white,
        pointBorderColor: 'transparent',
        pointHoverBackgroundColor: warning,
        data: agentData,
      },
      // {
      //   fill: false,
      //   tension: 0.5,
      //   pointRadius: 1,
      //   label: 'Service',
      //   pointHoverRadius: 5,
      //   pointStyle: 'circle',
      //   borderColor: success,
      //   backgroundColor: success,
      //   pointHoverBorderWidth: 5,
      //   pointHoverBorderColor: white,
      //   pointBorderColor: 'transparent',
      //   pointHoverBackgroundColor: success,
      //   data: [80, 99, 82, 90, 115, 115, 74, 75, 130, 155, 125, 90, 140, 130, 180]
      // }
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

  const handleOnChange = (dates: any) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <Card>
      <CardHeader
        title="Average Time For Response"
        // subheader='Commercial networks & enterprises'
        action={
          <DatePicker
            selectsRange
            id="chartjs-bar"
            endDate={endDate}
            selected={startDate}
            startDate={startDate}
            onChange={handleOnChange}
            placeholderText="Click to select a date"
            customInput={<CustomInput start={startDate} end={endDate} />}
          />
        }
      />
      <CardContent>
        <Line data={data} height={400} options={options} />
      </CardContent>
    </Card>
  );
};

export default ResponseTimeChart;
