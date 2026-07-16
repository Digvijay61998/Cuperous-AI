import { useEffect, useRef, useState } from 'react';
// ** MUI Imports
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { Card } from '@mui/material';

// ** Custom Components Imports
import PageHeader from 'src/@core/components/page-header';

// ** Styled Component Import
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts';
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker';

//** Bots Reports Components */
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import {
  getAllTicketsTotal, getTicketsReportDateWise, getTicketsReportDayWise
} from 'src/store/apps/reports/ticket';
import { dateWiseType } from 'src/types/report';
import DateWiseReport from 'src/views/reports/common/date-wise-multibar';
import DayWiseReport from 'src/views/reports/common/day-wise-multibar';
import DonutChart from 'src/views/reports/common/donut';

// ** Third Party Styles Import
import 'chart.js/auto';
import * as htmlToImage from "html-to-image";
import { getAllBotsList } from 'src/store/apps/reports/bots';
import { DateType } from 'src/types/forms/reactDatepickerTypes';

const createFileName = (extension = "", ...names: string[]) => {
  if (!extension) {
    return "";
  }
  return `${names.join("")}.${extension}`;
};

function ServiceRequestReports() {
  // ** Hook
  const theme = useTheme();

  // Vars
  const whiteColor = '#fff';
  const areaChartBlue = '#2c9aff';
  const barChartYellow = '#00a7ff';
  const horizontalBarInfo = '#26c6da';
  const warningColorShade = '#ffbd1f';
  const areaChartBlueLight = '#84d0ff';
  const areaChartGreyLight = '#edf1f4';
  const borderColor = theme.palette.divider;
  const labelColor = theme.palette.text.disabled;
  const legendColor = theme.palette.text.secondary;
  const lineChartYellow = '#d4e157';
  const lineChartPrimary = '#8082FF';
  const lineChartWarning = '#ff9800';
  
  const ref = useRef<HTMLDivElement>(null);
  const takeScreenShot = async (node: any) => {
    const dataURI = await htmlToImage.toJpeg(node);
    return dataURI;
  };
  const download = (image: any, { name = "ticketReport", extension = "jpg" } = {}) => {
    const a = document.createElement("a");
    a.href = image;
    a.download = createFileName(extension, name);
    a.click();
  };
  const downloadScreenshot = () => takeScreenShot(ref.current).then(download);

  const { ticketsTotal, ticketsDateWiseReport, ticketsDayWiseReport } =
    useSelector((state: RootState) => state.ticketsReport);
  const { botsList } = useSelector((state: RootState) => state.botReport);
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    if (dispatch) {
      dispatch(getAllTicketsTotal());
      dispatch(getTicketsReportDayWise(null));
      dispatch(getTicketsReportDateWise(null));
      dispatch(getAllBotsList());
    }
  }, [dispatch]);
  const [donutChartDataValues, setDonutChartDataValues] = useState<any[]>([]);
  useEffect(() => {
    if (ticketsTotal && Object.keys(ticketsTotal).length > 0) {
      let totalSummary = {...ticketsTotal};
      delete totalSummary.total;
      const values = Object.values(totalSummary);
      setDonutChartDataValues([...values]);
    }
  }, [ticketsTotal]);
  const [dayWiseData, setDayWiseData] = useState<dateWiseType>({
    labels: [],
    total: [],
    completed: [],
    expired: [],
  });

  useEffect(() => {
    if (ticketsDayWiseReport) {
      const labels = ticketsDayWiseReport.map((item: any) => item.day);
      const total = ticketsDayWiseReport.map((item: any) => item.total);
      const completed = ticketsDayWiseReport.map((item: any) => item.open);
      const expired = ticketsDayWiseReport.map((item: any) => item.closed);
      setDayWiseData({
        labels,
        total,
        completed,
        expired,
      });
    }
  }, [ticketsDayWiseReport]);

  const [dateWiseData, setDateWiseData] = useState<dateWiseType>({
    labels: [],
    total: [],
    completed: [],
    expired: [],
  });
  useEffect(() => {
    if (ticketsDateWiseReport) {
      const labels = ticketsDateWiseReport.map((item: any) => item.date);
      const total = ticketsDateWiseReport.map((item: any) => item.total);
      const completed = ticketsDateWiseReport.map((item: any) => item.closed);
      const expired = ticketsDateWiseReport.map((item: any) => item.open);
      setDateWiseData({
        labels,
        total,
        completed,
        expired,
      });
    }
  }, [ticketsDateWiseReport]);

  const [startDate, setStartDate] = useState<DateType>(null);
  const [endDate, setEndDate] = useState<DateType>(null);
  const handleOnChange = (dates: any) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };
  const [id, setId] = useState<any>('');
  useEffect(() => {
    if (id || endDate || startDate) {
      dispatch(getTicketsReportDayWise({ id, start: startDate, end: endDate }));
    }
  }, [dispatch, id, startDate, endDate]);

  const [startDateByDateWise, setStartDateByDateWise] =
    useState<DateType>(null);
  const [endDateByDateWise, setEndDateByDateWise] = useState<DateType>(null);
  const [botId, setBotId] = useState<any>('');
  const handleOnChangeByDate = (dates: any) => {
    const [start, end] = dates;
    setStartDateByDateWise(start);
    setEndDateByDateWise(end);
  };

  useEffect(() => {
    if (botId || endDateByDateWise || startDateByDateWise) {
      dispatch(
        getTicketsReportDateWise({
          id: botId,
          start: startDateByDateWise,
          end: endDateByDateWise,
        }),
      );
    }
  }, [dispatch, botId, startDateByDateWise, endDateByDateWise]);
  return (
    <ApexChartWrapper>
      <DatePickerWrapper>
      <div ref={ref}>
        <Grid container spacing={6} className="match-height">
          <Grid item xs={12}>
            <Card sx={{ px:6, py:2,
                        boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'
                       }}>
              <Grid container spacing={6} className="match-height">
                <PageHeader
                  title={
                    <Typography variant="h5">
                      {/* <Link href='https://github.com/apexcharts/react-apexcharts' target='_blank'> */}
                      Service Request Reports
                      {/* </Link> */}
                    </Typography>
                  }
                  subtitle={
                    <Typography variant="body2">
                      Service Request Reports in details
                    </Typography>
                  }
                  downloadReport={downloadScreenshot}
                />
              </Grid>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <DonutChart
              labels={[ 'Closed Request', 'Open Request']}
              values={donutChartDataValues}
              mainLabel={'Total Request'}
              title="Summary"
            />
          </Grid>
          <Grid item xs={12} md={8}>
            <DayWiseReport
              labelColor={labelColor}
              info={horizontalBarInfo}
              borderColor={borderColor}
              legendColor={legendColor}
              warning={warningColorShade}
              labels={dayWiseData.labels}
              total={dayWiseData.total}
              completed={dayWiseData.completed}
              expired={dayWiseData.expired}
              xLabelText="Service request counts"
              yLabelText="Days"
              titleText="Daywise Service Request"
              barTitle={['Total', 'Open', 'Closed']}
              menuList={botsList}
              inputFieldLabel={'Select Bot'}
              startDate={startDate}
              endDate={endDate}
              setStartDate={setStartDate}
              setEndDate={setEndDate}
              handleOnChange={handleOnChange}
              id={id}
              setId={setId}
            />
          </Grid>

          <Grid item xs={12}>
            <DateWiseReport
              yellow={barChartYellow}
              labelColor={labelColor}
              borderColor={borderColor}
              labels={dateWiseData.labels}
              total={dateWiseData.total}
              completed={dateWiseData.completed}
              expired={dateWiseData.expired}
              xLabelText="Date"
              yLabelText="Service Request Count"
              titleText="Datewise Service Request"
              barTitle={['Total', 'Closed', 'Open']}
              menuList={botsList}
              inputFieldLabel={'Select Bot'}
              startDate={startDateByDateWise}
              endDate={endDateByDateWise}
              setStartDate={setStartDateByDateWise}
              setEndDate={setEndDateByDateWise}
              handleOnChange={handleOnChangeByDate}
              id={botId}
              setId={setBotId}
            />
          </Grid>

          {/* <Grid item xs={12}>
            <AverageTime
              white={whiteColor}
              labelColor={labelColor}
              success={lineChartYellow}
              borderColor={borderColor}
              legendColor={legendColor}
              primary={lineChartPrimary}
              warning={lineChartWarning}
            />
          </Grid> */}
        </Grid>
      </div>
      </DatePickerWrapper>
    </ApexChartWrapper>
  );
}
export default ServiceRequestReports;
