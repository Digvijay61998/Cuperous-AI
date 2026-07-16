import { useEffect, useRef, useState } from 'react';
// ** MUI Imports
import { Card } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

// ** Custom Components Imports
import PageHeader from 'src/@core/components/page-header';

// ** Styled Component Import
import ApexChartWrapper from 'src/@core/styles/libs/react-apexcharts';
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker';


// ** Third Party Styles Import
import 'chart.js/auto';

import * as htmlToImage from "html-to-image";
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import {
  getAdsReportDateWise,
  getAdsReportDateWiseCompare, getAdsReportWeekWise, getAllAdsByBot,
  getAllAdsByTag, getAllAdsList, getAllAdsTotal
} from 'src/store/apps/reports/advertisements';
import { DateType } from 'src/types/forms/reactDatepickerTypes';
import DateWiseCompareReport from 'src/views/reports/advertisements/date-wise-compare';
import DateWiseReport from 'src/views/reports/advertisements/date-wise-multibar';
import DayWiseReport from 'src/views/reports/advertisements/day-wise-multibar';
import DonutChart from 'src/views/reports/advertisements/donut';

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

function AdsReports() {
  const theme = useTheme();
  const borderColor = theme.palette.divider;
  const labelColor = theme.palette.text.disabled;
  const legendColor = theme.palette.text.secondary;

  const ref = useRef<HTMLDivElement>(null);
  const takeScreenShot = async (node: any) => {
    const dataURI = await htmlToImage.toJpeg(node);
    return dataURI;
  };
  const download = (image: any, { name = "adReport", extension = "jpg" } = {}) => {
    const a = document.createElement("a");
    a.href = image;
    a.download = createFileName(extension, name);
    a.click();
  };
  const downloadScreenshot = () => takeScreenShot(ref.current).then(download);

  const label = { inputProps: { 'aria-label': 'Checkbox demo' } };

  const {
    total,
    totalByBot,
    totalByTag,
    weekWiseReport,
    dateWiseReport,
    dateWiseCompReport,
    adsList,
  } = useSelector((state: RootState) => state.advertisementsReports);

  const dispatch = useDispatch<AppDispatch>();

  const [botCompareId, setBotCompareId] = useState<any>('');
  const [botCompareId2, setBotCompareId2] = useState<any>('');
  const [botCompareLabel, setBotCompareLabel] = useState<any>(["Ad 1","Ad 2"]);

  useEffect(() => {
    if (dispatch) {
      dispatch(getAllAdsTotal());
      dispatch(getAllAdsByBot(null));
      dispatch(getAllAdsByTag(null));
      dispatch(getAdsReportWeekWise(null));
      dispatch(getAdsReportDateWise(null));
      dispatch(getAdsReportDateWiseCompare(null));
      dispatch(getAllAdsList());
    }
  }, [dispatch]);

  useEffect(() => {
    if (adsList && adsList?.length > 1) {
      // const firstIndex = adsList[0]?.title || 'Ad 1';;
      // const secondIndex = adsList[1]?.title || 'Ad 2';
      // setBotCompareLabel([firstIndex,secondIndex]);
      setBotCompareId(adsList[0]?.id || '');
      setBotCompareId2(adsList[1]?.id || '');
      // dispatch(
      //   getAdsReportDateWiseCompare({
      //     id: adsList[0]?.id,
      //     anotherId: adsList[1]?.id,
      //   }),
      // );
    }
  }, [adsList]);

  // first gird 
  const [donutChartDataNames, setDonutChartDataNames] = useState<any>([]);
  const [donutChartDataValues, setDonutChartDataValues] = useState<any>([]);
  const [donutChartDataTotal, setDonutChartDataTotal] = useState<string>('');
  useEffect(() => {
    if (total && total?.length > 0) {
      const names = total.map((item:any) => item?.title);
      const values = total.map((item:any) => item?.clicksCount);
      const totalValue = [...values].reduce((a:any, b:any) => a + b, 0);
      setDonutChartDataNames([...names]);
      setDonutChartDataValues([...values]);
      setDonutChartDataTotal(totalValue.toString());
    }
  }, [total]);

  // second grid
  const [donutChartBotDataNames, setDonutChartBotDataNames] = useState<any>([]);
  const [donutChartBotDataValues, setDonutChartBotDataValues] = useState<any>([]);
  const [donutChartBotDataTotal, setDonutChartBotDataTotal] = useState<string>('');
  useEffect(() => {
    if (totalByBot && totalByBot?.length > 0) {
      const names = totalByBot.map((item:any) => item?.bot);
      const values = totalByBot.map((item:any) => item?.total);
      const totalValue = [...values].reduce((a:any, b:any) => a + b, 0);
      setDonutChartBotDataNames([...names]);
      setDonutChartBotDataValues([...values]);
      setDonutChartBotDataTotal(totalValue.toString());
    }
  }, [totalByBot]);

  // third grid
  const [donutChartTagDataNames, setDonutChartTagDataNames] = useState<any>([]);
  const [donutChartTagDataValues, setDonutChartTagDataValues] = useState<any>([]);
  const [donutChartTagDataTotal, setDonutChartTagDataTotal] = useState<string>('');
  useEffect(() => {
    if (totalByTag && totalByTag?.length > 0) {
      const names = totalByTag.map((item:any) => item?.tag);
      const values = totalByTag.map((item:any) => item?.total);
      const totalValue = [...values].reduce((a:any, b:any) => a + b, 0);
      setDonutChartTagDataNames([...names]);
      setDonutChartTagDataValues([...values]);
      setDonutChartTagDataTotal(totalValue.toString());
    }
  }, [totalByTag]);

  // fourth grid
  const [dayWiseData, setDayWiseData] = useState<any>({
    labels: [],
    total: [],
    clicks: [],
  });
  useEffect(() => {
    if (weekWiseReport) {
      const labels = weekWiseReport.map((item: any) => item?.day);
      const total = weekWiseReport.map((item: any) => item?.total || 0);
      const clicks = weekWiseReport.map((item: any) => item?.clicks || 0);
      setDayWiseData({
        labels,
        total,
        clicks,
      });
    }
  }, [weekWiseReport]);

  // fifth gird
  const [dateWiseData, setDateWiseData] = useState<any>({
    labels: [],
    total: [],
    clicks: [],
  });
  useEffect(() => {
    if (dateWiseReport) {
      const labels = dateWiseReport.map((item: any) => item?.date);
      const total = dateWiseReport.map((item: any) => item?.total || 0);
      const clicks = dateWiseReport.map((item: any) => item?.clicks || 0);
      setDateWiseData({
        labels,
        total,
        clicks,
      });
    }
  }, [dateWiseReport]);

  // sixth grid
  const [dateWiseCompData, setDateWiseCompData] = useState<any>({
    labels: [],
    ad1: [],
    ad2: [],
  });
  useEffect(() => {
    if (dateWiseCompReport) {
      const labels = dateWiseCompReport.map((item: any) => item?.date);
      const ad1 = dateWiseCompReport.map((item: any) => item?.ad1 || 0);
      const ad2 = dateWiseCompReport.map((item: any) => item?.ad2 || 0);
      setDateWiseCompData({
        labels,
        ad1,
        ad2,
      });
    }
  }, [dateWiseCompReport]);

  // filters
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
        getAdsReportWeekWise({
          id,
          start: startDate,
          end: endDate,
        }),
      );
    }
  }, [id, startDate, endDate]);

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
        getAdsReportDateWise({
          id: botId,
          start: startDateByDateWise,
          end: endDateByDateWise,
        }),
      );
    }
  }, [botId, startDateByDateWise, endDateByDateWise]);

  const [startDateForCompare, setStartDateForCompare] = useState<DateType>(null);
  const [endDateForCompare, setEndDateForCompare] = useState<DateType>(null);

  const handleCompareOnChangeByDate = (dates: any) => {
    const [start, end] = dates;
    setStartDateForCompare(start);
    setEndDateForCompare(end);
  };

  useEffect(() => {
    if (botCompareId || botCompareId2) {
      const firstIndex =
        adsList.find((x: any) => x?.id === botCompareId)?.title || 'Ad 1';
      const secondIndex =
        adsList.find((x: any) => x?.id === botCompareId2)?.title || 'Ad 2';
      setBotCompareLabel([firstIndex, secondIndex]);
    }
  }, [botCompareId, botCompareId2]);

  useEffect(() => {
    if (
      botCompareId ||
      botCompareId2 ||
      endDateForCompare ||
      startDateForCompare
    ) {
      dispatch(
        getAdsReportDateWiseCompare({
          id: botCompareId,
          anotherId: botCompareId2,
          start: startDateForCompare,
          end: endDateForCompare,
        }),
      );
    }
  }, [botCompareId, botCompareId2, startDateForCompare, endDateForCompare]);

  return (
    <ApexChartWrapper>
      <DatePickerWrapper>
      <div ref={ref}>
        <Grid container spacing={6} className="match-height">
            <Grid item xs={12}>
              <Card sx={{ px:6, py:2 ,
      boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'
    }}>
                <Grid container spacing={6} className="match-height">
                  <PageHeader
                    title={<Typography variant="h5">Advertisement Reports</Typography>}
                    subtitle={
                      <Typography variant="body2">
                        Advertisement Reports in details
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
                totalValue={donutChartDataTotal}
                mainLabel={'Total'}
                title="Advertisement By Click"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <DonutChart
                labels={donutChartBotDataNames}
                values={donutChartBotDataValues}
                totalValue={donutChartBotDataTotal}
                mainLabel={'Total'}
                title="Bots By Ads Click"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <DonutChart
                labels={donutChartTagDataNames}
                values={donutChartTagDataValues}
                mainLabel={'Total'}
                totalValue={donutChartTagDataTotal}
                title="Tags By Ads Click"
              />
            </Grid>
  
            <Grid item xs={12}>
            <DayWiseReport
              labelColor={labelColor}
              info={horizontalBarInfo}
              borderColor={borderColor}
              legendColor={legendColor}
              warning={warningColorShade}
              lineChartYellow={lineChartYellow}
              lineChartPrimary={lineChartPrimary}
              lineChartWarning={lineChartWarning}
              labels={dayWiseData.labels}
              // total={dayWiseData.total}
              clicks={dayWiseData.clicks}
              xLabelText="Clicks Count"
              yLabelText="Days"
              titleText="Ads clicks by days"
              barTitle={['Total clicks in ad']}
              menuList={adsList}
              inputFieldLabel={'Select Ads'}
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
              // total={dateWiseData.total}
              clicks={dateWiseData.clicks}
              xLabelText="Date"
              yLabelText="Clicks Count"
              titleText="Ads clicks by dates"
              barTitle={['Total clicks in ad']}
              menuList={adsList}
              inputFieldLabel={'Select Ads'}
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
              labels={dateWiseCompData.labels}
              ads1={dateWiseCompData.ad1}
              ads2={dateWiseCompData.ad2}
              xLabelText="Date"
              yLabelText="Clicks Count"
              titleText="Ads comparison by clicks"
              barTitle={botCompareLabel}
              menuList={adsList}
              inputFieldLabel={'Select Ads'}
              startDate={startDateForCompare}
              endDate={endDateForCompare}
              setStartDate={setStartDateForCompare}
              setEndDate={setEndDateForCompare}
              handleOnChange={handleCompareOnChangeByDate}
              compareId={botCompareId}
              setCompareId={setBotCompareId}
              compareId2={botCompareId2}
              setCompareId2={setBotCompareId2}
            />
          </Grid>
        </Grid>
      </div>
      </DatePickerWrapper>
    </ApexChartWrapper>
  );
}
export default AdsReports;
