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

interface BarProp {
  yellow: string;
  labelColor: string;
  borderColor: string;
  data: any;
}

const BotsPerformance = (props: BarProp) => {
  // ** Props
  const { yellow, labelColor, borderColor, data: reportData } = props;

  // ** States
  const [endDate, setEndDate] = useState<DateType>(null);
  const [startDate, setStartDate] = useState<DateType>(new Date());
  const [dateWiseData, setDateWiseData] = useState<any>({
    labels: [],
    total: [],
    completed: [],
    expired: [],
  });
  useEffect(() => {
    if (reportData && reportData?.length > 0) {
      const labels = reportData.map((item: any) => item._id);
      const total = reportData.map((item: any) => item.total);
      const completed = reportData.map((item: any) => item.completed);
      const expired = reportData.map((item: any) => item.expired);
      setDateWiseData({
        labels,
        total,
        completed,
        expired,
      });
    }
  }, [reportData]);
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500 },
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
          text: 'Date',
          font: {
            size: 18
          }
        },
      },
      y: {
        min: 0,
        max: 400,
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
          text: 'Conversations Count',
          font: {
            size: 16
          }
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
      title: {
        display: true,
        text: 'Bot conversation by dates',
        font: {
          size: 18
        }
      },
    },
  };

  const data: ChartData<'bar'> = {
    labels: dateWiseData.labels,
    datasets: [
      {
        maxBarThickness: 15,
        label: 'Total',
        backgroundColor: '#FCD835',
        borderColor: 'transparent',
        borderRadius: { topRight: 15, topLeft: 15 },
        data: dateWiseData.total,
      },
      {
        maxBarThickness: 15,
        label: 'Completed',
        backgroundColor: '#00D4BD',
        borderColor: 'transparent',
        borderRadius: { topRight: 15, topLeft: 15 },
        data: dateWiseData.completed,
      },

      {
        maxBarThickness: 15,
        label: 'Expired',
        backgroundColor: '#32475cde',
        borderColor: 'transparent',
        borderRadius: { topRight: 15, topLeft: 15 },
        data: dateWiseData.expired,
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

  const handleOnChange = (dates: any) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };

  return (
    <Card>
      <CardHeader
        title="Bots Performance"
        sx={{
          flexDirection: ['column', 'row'],
          alignItems: ['flex-start', 'center'],
          '& .MuiCardHeader-action': { mb: 0 },
          '& .MuiCardHeader-content': { mb: [2, 0] },
        }}
        action={
          <>
            {/* <Grid container spacing={6} className="match-height">
              <Grid item xs={12} md={6}>
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
              </Grid>

              <Grid item xs={12} md={6}>
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
              </Grid>
            </Grid> */}
          </>
        }
      />
      <CardContent>
        {dateWiseData && dateWiseData?.labels.length > 0 && (
          <Bar data={data} height={400} options={options} />
        )}
      </CardContent>
    </Card>
  );
};

export default BotsPerformance;
