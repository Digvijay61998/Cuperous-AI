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
  getAllVisitorsDetails,
  getAllVisitorsTotal, getVisitorsHandledByAgent, getVisitorsHandledByBots
} from 'src/store/apps/reports/visitors';
import { DateType } from 'src/types/forms/reactDatepickerTypes';
import { dateWiseType } from 'src/types/report';
import DateWiseReport from 'src/views/reports/common/date-wise-multibar';
import DonutChart from 'src/views/reports/common/donut';

// ** Third Party Styles Import
import 'chart.js/auto';
import * as htmlToImage from "html-to-image";
import { getAllAgentsList } from 'src/store/apps/reports/agent';
import { getAllBotsList } from 'src/store/apps/reports/bots';

const createFileName = (extension = "", ...names: string[]) => {
  if (!extension) {
    return "";
  }
  return `${names.join("")}.${extension}`;
};

// Vars
const whiteColor = '#fff';
const areaChartBlue = '#2c9aff';
const barChartYellow = '#00a7ff';
const horizontalBarInfo = '#26c6da';
const warningColorShade = '#ffbd1f';
const areaChartBlueLight = '#84d0ff';
const areaChartGreyLight = '#edf1f4';

const lineChartYellow = '#d4e157';
const lineChartPrimary = '#8082FF';
const lineChartWarning = '#ff9800';

function VisitorsReports() {
  const theme = useTheme();
  const borderColor = theme.palette.divider;
  const labelColor = theme.palette.text.disabled;
  const legendColor = theme.palette.text.secondary;
  
  const ref = useRef<HTMLDivElement>(null);
  const takeScreenShot = async (node: any) => {
    const dataURI = await htmlToImage.toJpeg(node);
    return dataURI;
  };
  const download = (image: any, { name = "visitorReport", extension = "jpg" } = {}) => {
    const a = document.createElement("a");
    a.href = image;
    a.download = createFileName(extension, name);
    a.click();
  };
  const downloadScreenshot = () => takeScreenShot(ref.current).then(download);

  const { totalVisitors, visitorsDetails, handledByBots, handledByAgents } =
    useSelector((state: RootState) => state.VisitorsReports);
  const { botsList } = useSelector((state: RootState) => state.botReport);
  const { agentList } = useSelector((state: RootState) => state.agentReport);
  const [totalVisitorsData, setTotalVisitorsData] = useState<any>([2, 1]);
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    if (dispatch) {
      dispatch(getAllVisitorsDetails());
      dispatch(getAllVisitorsTotal());
      dispatch(getVisitorsHandledByAgent(null));
      dispatch(getVisitorsHandledByBots(null));
      dispatch(getAllBotsList());
      dispatch(getAllAgentsList());
    }
  }, [dispatch]);
  useEffect(() => {
    if (totalVisitors && Object.keys(totalVisitors).length > 0) {
      let summary = {...totalVisitors};
      delete summary?.total;
      const values = Object.values(summary);
      setTotalVisitorsData([...values]);
    }
  }, [totalVisitors]);

  type visitorDetailsDataType = {
    countriesCountArr: any[];
    countriesNameArr: any[];
    browserCountArr: any[];
    browserNameArr: any[];
    osCountArr: any[];
    osNameArr: any[];
  };
  const [visitorsDetailsData, setVisitorsDetailsData] =
    useState<visitorDetailsDataType>({
      countriesCountArr: [],
      countriesNameArr: [],
      browserCountArr: [],
      browserNameArr: [],
      osCountArr: [],
      osNameArr: [],
    });
  useEffect(() => {
    if (visitorsDetails) {
      let countriesCountArr,
        countriesNameArr,
        browserCountArr,
        browserNameArr,
        osCountArr,
        osNameArr;
      if (visitorsDetails?.countries && visitorsDetails?.countries.length > 0) {
        countriesCountArr = visitorsDetails?.countries.map(
          (item: any) => item.count,
        );
        countriesNameArr = visitorsDetails?.countries.map((item: any) =>
          String(item.name),
        );
      }
      if (visitorsDetails?.browsers && visitorsDetails?.browsers.length > 0) {
        browserCountArr = visitorsDetails?.browsers.map(
          (item: any) => item.count,
        );
        browserNameArr = visitorsDetails?.browsers.map((item: any) =>
          String(item.name),
        );
      }
      if (visitorsDetails?.os && visitorsDetails?.os.length > 0) {
        osCountArr = visitorsDetails?.os.map((item: any) => item.count);
        osNameArr = visitorsDetails?.os.map((item: any) => String(item.name));
      }

      setVisitorsDetailsData({
        countriesCountArr,
        countriesNameArr,
        browserCountArr,
        browserNameArr,
        osCountArr,
        osNameArr,
      });
    }
  }, [visitorsDetails]);
  const [dateWiseData, setDateWiseData] = useState<dateWiseType>({
    labels: [],
    total: [],
    completed: [],
    expired: [],
  });
  useEffect(() => {
    if (handledByBots && handledByBots?.length > 0) {
      const labels = handledByBots.map((item: any) => item.date);
      const total = handledByBots.map((item: any) => item.total);
      const completed = handledByBots.map((item: any) => item.completed);
      const expired = handledByBots.map((item: any) => item.expired);
      setDateWiseData({
        labels,
        total,
        completed,
        expired,
      });
    }
  }, [handledByBots]);

  const [dateWiseAgentData, setDateWiseAgentData] = useState<dateWiseType>({
    labels: [],
    total: [],
    completed: [],
    expired: [],
  });
  useEffect(() => {
    if (handledByAgents && handledByAgents?.length > 0) {
      const labels = handledByAgents.map((item: any) => item.date);
      const total = handledByAgents.map((item: any) => item.total);
      const completed = handledByAgents.map((item: any) => item.completed);
      const expired = handledByAgents.map((item: any) => item.expired);
      setDateWiseAgentData({
        labels,
        total,
        completed,
        expired,
      });
    }
  }, [handledByAgents]);

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
        getVisitorsHandledByBots({
          id: botId,
          start: startDateByDateWise,
          end: endDateByDateWise,
        }),
      );
    }
  }, [dispatch, botId, startDateByDateWise, endDateByDateWise]);

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
      dispatch(
        getVisitorsHandledByAgent({ id, start: startDate, end: endDate }),
      );
    }
  }, [dispatch, id, startDate, endDate]);

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
                      Visitors Reports
                      {/* </Link> */}
                    </Typography>
                  }
                  subtitle={
                    <Typography variant="body2">
                      Visitors Reports in details
                    </Typography>
                  }
                  downloadReport={downloadScreenshot}
                />
              </Grid>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <DonutChart
              labels={[
                'Active Visitors',
                'Inactive Visitors',
              ]}
              values={totalVisitorsData}
              mainLabel={'Total'}
              title="Visitors Summary"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <DonutChart
              labels={visitorsDetailsData?.osNameArr}
              values={visitorsDetailsData?.osCountArr}
              mainLabel={'Total'}
              title="Visitors By OS"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <DonutChart
              labels={visitorsDetailsData?.countriesNameArr}
              values={visitorsDetailsData?.countriesCountArr}
              mainLabel={'Total'}
              title="Visitors By Location"
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <DonutChart
              labels={visitorsDetailsData?.browserNameArr}
              values={visitorsDetailsData?.browserCountArr}
              mainLabel={'Total'}
              title="Visitors By Browsers"
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
              yLabelText="Visitors Count"
              titleText="Visitors Handled By Bots"
              barTitle={['Total', 'Completed', 'Expired']}
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

          <Grid item xs={12}>
            <DateWiseReport
              yellow={barChartYellow}
              labelColor={labelColor}
              borderColor={borderColor}
              labels={dateWiseAgentData.labels}
              total={dateWiseAgentData.total}
              completed={dateWiseAgentData.completed}
              expired={dateWiseAgentData.expired}
              xLabelText="Date"
              yLabelText="Visitors Count"
              titleText="Visitors Handled By Agents"
              barTitle={['Total', 'Completed', 'Expired']}
              barColorsArr={['#F0B27A', '#CCCCFF', '#76D7C4']}
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
export default VisitorsReports;
