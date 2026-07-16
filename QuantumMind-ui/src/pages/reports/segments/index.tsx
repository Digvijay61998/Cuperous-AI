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
import { DateType } from 'src/types/forms/reactDatepickerTypes';
import { dateWiseType } from 'src/types/report';
import DonutChart from 'src/views/reports/common/donut';
import DateWiseCompareReport from 'src/views/reports/segments/date-wise-compare-report';
import DateWiseReport from 'src/views/reports/segments/date-wise-report';
import DayWiseReport from 'src/views/reports/segments/day-wise-report';
// ** Third Party Styles Import
import 'chart.js/auto';
import * as htmlToImage from "html-to-image";
import {
  getAllSegmentsList,
  getAllSegmentsTotal,
  getSegmentsReportDateWise, getSegmentsReportDateWiseCompare, getSegmentsReportWeekWise
} from 'src/store/apps/reports/segments';

const createFileName = (extension = "", ...names: string[]) => {
  if (!extension) {
    return "";
  }
  return `${names.join("")}.${extension}`;
};

function SegmentReports() {
  // ** Hook
  const theme = useTheme();

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
  const download = (image: any, { name = "segmentReport", extension = "jpg" } = {}) => {
    const a = document.createElement("a");
    a.href = image;
    a.download = createFileName(extension, name);
    a.click();
  };
  const downloadScreenshot = () => takeScreenShot(ref.current).then(download);

  const {
    total,
    weekWiseReport,
    dateWiseReport,
    segmentsList,
    dateWiseCompareReport,
  } = useSelector((state: RootState) => state.segmentsReports);
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    if (dispatch) {
      dispatch(getAllSegmentsTotal());
      dispatch(getSegmentsReportWeekWise(null));
      dispatch(getSegmentsReportDateWise(null));
      dispatch(getAllSegmentsList());
    }
  }, [dispatch]);
  const [compareDateWiseLabels, setCompareDateWiseLabels] = useState<any>([]);
  const [comparedId, setComparedId] = useState<string>('');
  const [comparingId, setComparingId] = useState<string>('');
  useEffect(() => {
    if (segmentsList && segmentsList.length > 1) {
      const firstIndex = segmentsList[0]?.name || 'Segment 1';
      const secondIndex = segmentsList[1]?.name || 'Segment 2';
      setComparingId(segmentsList[0]?.id || '');
      setComparedId(segmentsList[1]?.id || '');
      setCompareDateWiseLabels([firstIndex, secondIndex]);
      dispatch(
        getSegmentsReportDateWiseCompare({
          id: segmentsList[0].id,
          compareId: segmentsList[1].id,
        }),
      );
    }
  }, [dispatch, segmentsList]);

  const [donutChartDataNames, setDonutChartDataNames] = useState<any>([]);
  const [donutChartDataValues, setDonutChartDataValues] = useState<any>([]);
  useEffect(() => {
    if (total && total?.length > 0) {
      const names = total.map((item: any) => item.name);
      const values = total.map((item: any) => item.numberOfVisitors);
      const totalValue = values.reduce((a: number, b: number) => a + b, 0);
      setDonutChartDataNames(['Total visitor', ...names]);
      setDonutChartDataValues([totalValue, ...values]);
    }
  }, [total]);

  const [dayWiseData, setDayWiseData] = useState<dateWiseType>({
    labels: [],
    total: [],
    completed: [],
    expired: [],
  });

  useEffect(() => {
    if (weekWiseReport) {
      const labels = weekWiseReport.map((item: any) => item?.day);
      const total = weekWiseReport.map((item: any) => item?.total);
      const completed = weekWiseReport.map((item: any) => item?.completed);
      const expired = weekWiseReport.map((item: any) => item?.expired);
      setDayWiseData({
        labels,
        total,
        completed,
        expired,
      });
    }
  }, [weekWiseReport]);

  const [dateWiseData, setDateWiseData] = useState<dateWiseType>({
    labels: [],
    total: [],
    completed: [],
    expired: [],
  });
  useEffect(() => {
    if (dateWiseReport) {
      const labels = dateWiseReport.map((item: any) => item.date);
      const total = dateWiseReport.map((item: any) => item.total);
      const completed = dateWiseReport.map((item: any) => item.completed);
      const expired = dateWiseReport.map((item: any) => item.expired);
      setDateWiseData({
        labels,
        total,
        completed,
        expired,
      });
    }
  }, [dateWiseReport]);

  const [startDate, setStartDate] = useState<DateType>(null);
  const [endDate, setEndDate] = useState<DateType>(null);
  const handleOnChange = (dates: any) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };
  const [id, setId] = useState<any>('');
  const [selectedSegmentName, setSelectedSegmentName] = useState<string>('');
  useEffect(() => {
    if (id || endDate || startDate) {
      dispatch(
        getSegmentsReportWeekWise({
          id,
          start: startDate,
          end: endDate,
        }),
      );
      let segmentName =
        segmentsList.find((item: any) => item.id === id)?.name || '';
      setSelectedSegmentName(segmentName);
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
        getSegmentsReportDateWise({
          id: botId,
          start: startDateByDateWise,
          end: endDateByDateWise,
        }),
      );
    }
  }, [dispatch, botId, startDateByDateWise, endDateByDateWise]);

  // compare segment fetch data
  const [compareSegmentData, setCompareSegmentData] = useState<any>({});
  useEffect(() => {
    if (dateWiseCompareReport && dateWiseCompareReport.length > 0) {
      const labels = dateWiseCompareReport.map((item: any) => item.date);
      const segment1 = dateWiseCompareReport.map((item: any) => item.segment1);
      const segment2 = dateWiseCompareReport.map((item: any) => item.segment2);
      setCompareSegmentData({
        labels,
        segment1,
        segment2,
      });
    }
  }, [dateWiseCompareReport]);

  // compare segment with date wise
  const [compareStartDate, setCompareStartDate] = useState<DateType>(null);
  const [compareEndDate, setCompareEndDate] = useState<DateType>(null);

  const handleCompareOnChange = (dates: any) => {
    const [start, end] = dates;
    setCompareStartDate(start);
    setCompareEndDate(end);
  };
  useEffect(() => {
    if (comparedId || comparingId || compareEndDate || compareStartDate) {
      const firstIndex =
        segmentsList.find((item: any) => item?.id === comparingId)?.name ||
        'Segment 1';
      const secondIndex =
        segmentsList.find((item: any) => item?.id === comparedId)?.name ||
        'Segment 2';
      setCompareDateWiseLabels([firstIndex, secondIndex]);
      dispatch(
        getSegmentsReportDateWiseCompare({
          id: comparingId,
          compareId: comparedId,
          start: compareStartDate,
          end: compareEndDate,
        }),
      );
    }
  }, [dispatch, comparedId, comparingId, compareStartDate, compareEndDate]);
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
                  title={<Typography variant="h5">Segment Reports</Typography>}
                  subtitle={
                    <Typography variant="body2">
                      Segment Reports in details
                    </Typography>
                  }
                  downloadReport={downloadScreenshot}
                />
              </Grid>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <DonutChart
              labels={donutChartDataNames}
              values={donutChartDataValues}
              mainLabel={'Total Visitors'}
              title="Visitor Popularity"
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
              expired={[]}
              xLabelText="Segment Visit"
              yLabelText="Days"
              titleText="Segment visitors by days"
              barTitle={['Total visitor in segment']}
              menuList={segmentsList}
              inputFieldLabel={'Select Segment'}
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
              yLabelText="Visitor Counts"
              titleText="Datewise segment visitor count"
              barTitle={['Total visitor in segment']}
              menuList={segmentsList}
              inputFieldLabel={'Select Segment'}
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
            <DateWiseCompareReport
              yellow={barChartYellow}
              labelColor={labelColor}
              borderColor={borderColor}
              labels={compareSegmentData.labels}
              total={compareSegmentData.segment1}
              completed={compareSegmentData.segment2}
              expired={compareSegmentData.expired || []}
              xLabelText="Date"
              yLabelText="Visit Count"
              titleText="Datewise segment visitor counts"
              barTitle={compareDateWiseLabels}
              menuList={segmentsList}
              inputFieldLabel={'Select Segment'}
              compareInputLabel={'Compare With'}
              isCompare={true}
              compareId={comparedId}
              setCompareId={setComparedId}
              startDate={compareStartDate}
              endDate={compareEndDate}
              setStartDate={setCompareStartDate}
              setEndDate={setCompareEndDate}
              handleOnChange={handleCompareOnChange}
              id={comparingId}
              setId={setComparingId}
            />
          </Grid>
        </Grid>
      </div>
      </DatePickerWrapper>
    </ApexChartWrapper>
  );
}
export default SegmentReports;
