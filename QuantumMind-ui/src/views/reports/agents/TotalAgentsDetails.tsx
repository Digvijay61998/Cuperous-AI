import { useState, useEffect } from 'react';

// ** MUI Imports
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';

// ** Third Party Imports
import { ApexOptions } from 'apexcharts';

// ** Component Import
import ReactApexcharts from 'src/@core/components/react-apexcharts';

// ** Util Import
import { hexToRGBA } from 'src/@core/utils/hex-to-rgba';

const radialBarColors = {
  series1: '#fdd835',
  series2: '#29CCEF',
  series3: '#00d4bd',
  series4: '#7367f0',
  series5: '#FFA1A1',
};
type Props = {
  data: any;
};
const ApexRadialBarChart = ({ data }: Props) => {

  const [chartData, setChartData] = useState<any>({
    labels: [],
    values: [],
  });
  console.log('data summary', data)
  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      let totalSummary = {...data}
      delete totalSummary?.total
      const keys = Object.keys(totalSummary);
      const values = Object.values(totalSummary);
      setChartData({
        labels: keys,
        values: values,
      });
    }
  }, [data]);
  // ** Hook
  const theme = useTheme();

  const options: ApexOptions = {
    stroke: { lineCap: 'round' },
    labels: ["Active", "InActive"],
    legend: {
      show: true,
      position: 'bottom',
      labels: {
        colors: theme.palette.text.secondary,
      },
      markers: {
        offsetX: -3,
      },
      itemMargin: {
        vertical: 3,
        horizontal: 10,
      },
    },
    colors: [
      radialBarColors.series1,
      radialBarColors.series2,
      radialBarColors.series4,
    ],
    plotOptions: {
      radialBar: {
        hollow: { size: '30%' },
        track: {
          margin: 15,
          background: hexToRGBA(theme.palette.customColors.trackBg, 1),
        },
        dataLabels: {
          name: {
            fontSize: '2rem',
          },
          value: {
            fontSize: '1rem',
            color: theme.palette.text.secondary,
          },
          total: {
            show: true,
            fontWeight: 400,
            label: 'Total Agents',
            fontSize: '1.125rem',
            color: theme.palette.text.primary,
            formatter: function (w) {
              const totalValue =w.globals.series[0]

              if (totalValue % 2 === 0) {
                return totalValue.toString() ;
              } else {
                return totalValue.toFixed(0).toString() ;
              }
            },
          },
        },
      },
    },
    grid: {
      padding: {
        top: -35,
        bottom: -30,
      },
    },
  };

  return (
    <Card  sx={{
      boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'
    }}>
      <CardHeader title="Agents Details" />
      <CardContent>
       {chartData && chartData?.labels.length >0 && <ReactApexcharts
          type="radialBar"
          height={400}
          options={options}
          series={chartData.values}
        />}
      </CardContent>
    </Card>
  );
};

export default ApexRadialBarChart;
