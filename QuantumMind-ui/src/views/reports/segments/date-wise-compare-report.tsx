// ** React Imports

// ** MUI Imports
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';

// ** Third Party Imports
import { ChartData, ChartOptions } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// ** Icon Imports

// ** Types
import { Stack, Typography } from '@mui/material';
import MenuAndDateRangeComp from '../common/common-component/menu-and-date-range';
interface BarProp {
  yellow: string;
  labelColor: string;
  borderColor: string;
  total: any;
  completed: any;
  expired: any;
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
  id?: any;
  setId?: any;
  compareInputLabel?: string;
  isCompare?: boolean;
  compareId?: any;
  setCompareId?: any;
}

const DateWiseReport = (props: BarProp) => {
  // ** Props
  const {
    yellow,
    labelColor,
    borderColor,
    total,
    expired,
    completed,
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
    id,
    setId,
    compareInputLabel,
    isCompare,
    compareId,
    setCompareId,
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
        backgroundColor: (barColorsArr && barColorsArr[0]) || '#2c9aff',
        borderColor: 'transparent',
        borderRadius: { topRight: 15, topLeft: 15 },
        data: total,
      },
      {
        maxBarThickness: 15,
        label: barTitle[1],
        backgroundColor: (barColorsArr && barColorsArr[1]) || '#32475cde',
        borderColor: 'transparent',
        borderRadius: { topRight: 15, topLeft: 15 },
        data: completed,
      },
    ],
  };


  return (
    <Card sx={{
      boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'
    }} >
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
            compareInputLabel={compareInputLabel}
            isCompare={isCompare}
            compareId={compareId}
            setCompareId={setCompareId}
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

export default DateWiseReport;
