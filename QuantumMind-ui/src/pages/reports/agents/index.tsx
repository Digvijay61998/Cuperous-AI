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
import { DateType } from 'src/types/forms/reactDatepickerTypes';
import { dateWiseType } from 'src/types/report';
import TotalAgentsDetails from 'src/views/reports/agents/TotalAgentsDetails';
import DateWiseReport from 'src/views/reports/common/date-wise-multibar';
import DayWiseReport from 'src/views/reports/common/day-wise-multibar';

import * as htmlToImage from "html-to-image";
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import {
  getAgentReportDateWise, getAgentReportDayWise, getAllAgentsList, getAllAgentTotal
} from 'src/store/apps/reports/agent';
// ** Third Party Styles Import
import 'chart.js/auto';

const createFileName = (extension = "", ...names: string[]) => {
  if (!extension) {
    return "";
  }
  return `${names.join("")}.${extension}`;
};

function AgentsReports() {
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
  const download = (image: any, { name = "agentReport", extension = "jpg" } = {}) => {
    const a = document.createElement("a");
    a.href = image;
    a.download = createFileName(extension, name);
    a.click();
  };
  const downloadScreenshot = () => takeScreenShot(ref.current).then(download);

  const {
    agentSummaryTotal,
    agentDateWiseReport,
    agentDayWiseReport,
    agentList,
  } = useSelector((state: RootState) => state.agentReport);
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    if (dispatch) {
      dispatch(getAllAgentTotal());
      dispatch(getAgentReportDayWise(null));
      dispatch(getAgentReportDateWise(null));
      dispatch(getAllAgentsList());
    }
  }, [dispatch]);

  const [dayWiseData, setDayWiseData] = useState<dateWiseType>({
    labels: [],
    total: [],
    completed: [],
    expired: [],
  });

  useEffect(() => {
    if (agentDayWiseReport && agentDayWiseReport?.length > 0) {
      const labels = agentDayWiseReport.map((item: any) => item.day);
      const total = agentDayWiseReport.map((item: any) => item.total);
      const completed = agentDayWiseReport.map((item: any) => item.completed);
      const expired = agentDayWiseReport.map((item: any) => item.expired);
      setDayWiseData({
        labels,
        total,
        completed,
        expired,
      });
    }
  }, [agentDayWiseReport]);

  const [dateWiseData, setDateWiseData] = useState<dateWiseType>({
    labels: [],
    total: [],
    completed: [],
    expired: [],
  });
  useEffect(() => {
    if (agentDateWiseReport && agentDateWiseReport?.length > 0) {
      const labels = agentDateWiseReport.map((item: any) => item.date);
      const total = agentDateWiseReport.map((item: any) => item.total);
      const completed = agentDateWiseReport.map((item: any) => item.completed);
      const expired = agentDateWiseReport.map((item: any) => item.expired);
      setDateWiseData({
        labels,
        total,
        completed,
        expired,
      });
    }
  }, [agentDateWiseReport]);

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
      dispatch(getAgentReportDayWise({ id, start: startDate, end: endDate }));
    }
  }, [dispatch, id, startDate, endDate]);

  const [startDateByDateWise, setStartDateByDateWise] =
    useState<DateType>(null);
  const [endDateByDateWise, setEndDateByDateWise] = useState<DateType>(null);
  const [agentId, setAgentId] = useState<any>('');
  const handleOnChangeByDate = (dates: any) => {
    const [start, end] = dates;
    setStartDateByDateWise(start);
    setEndDateByDateWise(end);
  };

  useEffect(() => {
    if (agentId || endDateByDateWise || startDateByDateWise) {
      dispatch(
        getAgentReportDateWise({
          id: agentId,
          start: startDateByDateWise,
          end: endDateByDateWise,
        }),
      );
    }
  }, [dispatch, agentId, startDateByDateWise, endDateByDateWise]);
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
                      Agents Reports
                    </Typography>
                  }
                  subtitle={
                    <Typography variant="body2">Agents Reports in details</Typography>
                  }
                  downloadReport={downloadScreenshot}
                />
              </Grid>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <TotalAgentsDetails data={agentSummaryTotal} />
          </Grid>
          <Grid item xs={12} md={7}>
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
              xLabelText="Conversations count"
              yLabelText="Days"
              titleText="Daywise conversation"
              barTitle={['Total', 'Completed', 'Expired']}
              menuList={agentList}
              inputFieldLabel={'Select Agent'}
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
              yLabelText="Conversations Count"
              titleText="Datewise conversation"
              barTitle={['Total', 'Completed', 'Expired']}
              menuList={agentList}
              inputFieldLabel={'Select Agent'}
              startDate={startDateByDateWise}
              endDate={endDateByDateWise}
              setStartDate={setStartDateByDateWise}
              setEndDate={setEndDateByDateWise}
              handleOnChange={handleOnChangeByDate}
              id={agentId}
              setId={setAgentId}
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
export default AgentsReports;
