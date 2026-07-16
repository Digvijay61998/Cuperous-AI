// ** MUI Imports
import { Stack, Typography } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
// ** Third Party Imports
import { ChartData, ChartOptions } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import MenuAndDateRangeComp from './common-component/menu-and-date-range';

interface Props {
  info: string;
  warning: string;
  labelColor: string;
  borderColor: string;
  legendColor: string;
  labels: any;
  total: any;
  completed: any;
  expired: any;
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
  compareId?: any;
  setCompareId?: any;

}

const Report = (props: Props) => {
  // ** Props
  const {
    info,
    warning,
    labelColor,
    borderColor,
    legendColor,
    labels,
    total,
    expired,
    completed,
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
    compareId,
    setCompareId,
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
        title: {
          display: true,
          text: componentTitle,
          font: {
            size: 16,
          }
        },
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
        data: completed,
      },
      {
        maxBarThickness: 15,
        backgroundColor: legendColor,
        label: barTitle[2],
        borderColor: 'transparent',
        data: expired,
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
