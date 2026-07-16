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
import DateWiseCompareReport from 'src/views/reports/social/date-wise-compare';
import DateWiseReport from 'src/views/reports/social/date-wise-multibar';
import DayWiseReport from 'src/views/reports/social/day-wise-multibar';
import DonutChart from 'src/views/reports/social/donut';

// ** Third Party Styles Import
import 'chart.js/auto';
import * as htmlToImage from "html-to-image";
import { getAllBotsList } from 'src/store/apps/reports/bots';
import {
  getAllSocialConCount, getSocialReportDateWise,
  getSocialReportDateWiseCompare, getSocialReportDayWise
} from 'src/store/apps/reports/social';

const createFileName = (extension = "", ...names: string[]) => {
  if (!extension) {
    return "";
  }
  return `${names.join("")}.${extension}`;
};

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

type dateWiseType = {
  labels: any[];
  total: any[];
  facebook: any[];
  telegram: any[];
  whatsapp: any[];
  widget: any[];
}

function SocialReports() {
  // ** Hook
  const theme = useTheme();
  const borderColor = theme.palette.divider;
  const labelColor = theme.palette.text.disabled;
  const legendColor = theme.palette.text.secondary;
  
  const ref = useRef<HTMLDivElement>(null);
  const takeScreenShot = async (node: any) => {
    const dataURI = await htmlToImage.toJpeg(node);
    return dataURI;
  };
  const download = (image: any, { name = "socialReport", extension = "jpg" } = {}) => {
    const a = document.createElement("a");
    a.href = image;
    a.download = createFileName(extension, name);
    a.click();
  };
  const downloadScreenshot = () => takeScreenShot(ref.current).then(download);

  const dispatch = useDispatch<AppDispatch>();
  const { total, 
    dayWiseReport, 
    dateWiseReport,
    dateWiseCompReport, 
  } = useSelector((state: RootState) => state.socialReports); 
  const { botsList } = useSelector((state: RootState) => state.botReport);
  
  const [botCompareId, setBotCompareId] = useState<any>('');
  const [botCompareId2, setBotCompareId2] = useState<any>('');
  const [platform, setPlatform] = useState<any>('total');
  const [botCompareLabel, setBotCompareLabel] = useState<any>(["Bot 1(total)","Bot 2(total)"]);
  
  useEffect(() => {
    if (dispatch) {
      dispatch(getAllSocialConCount());
      dispatch(getSocialReportDayWise(null));
      dispatch(getSocialReportDateWise(null));
      dispatch(getSocialReportDateWiseCompare(null));
      dispatch(getAllBotsList());
    }
  }, [dispatch]);

  useEffect(() => {
    if (botsList && botsList.length > 1) {
      // const firstIndex = botsList[0]?.name || 'Bot 1';
      // const secondIndex = botsList[1]?.name || 'Bot 2';
      // setBotCompareLabel([ firstIndex+`(${platform})`, secondIndex+`(${platform})` ]);
      setBotCompareId(botsList[0]?.id || '');
      setBotCompareId2(botsList[1]?.id || '');
      // dispatch(
      //   getSocialReportDateWiseCompare({
      //     id: botsList[0].id,
      //     anotherId: botsList[1].id,
      //   }),
      // );
    }
  }, [botsList]);

  // first grid
  const [donutChartDataNames, setDonutChartDataNames] = useState<any>([]);
  const [donutChartDataValues, setDonutChartDataValues] = useState<any>([]);
  const [donutChartDataTotal, setDonutChartDataTotal] = useState<string>('');
  useEffect(() => {
    if (total && Object.keys(total).length > 0) {
      const names:any = Object.keys(total);
      const values:any = Object.values(total);
      const totalValue:any = [...values].reduce((a:any, b:any) => a + b, 0);
      setDonutChartDataNames([...names]);
      setDonutChartDataValues([...values]);
      setDonutChartDataTotal(totalValue.toString());
    }
  }, [total]);

  // second grid
  const [dayWiseData, setDayWiseData] = useState<dateWiseType>({
    labels: [],
    total: [],
    facebook: [],
    telegram: [],
    whatsapp: [],
    widget: [],
  });
  useEffect(() => {
    if (dayWiseReport) {
      const labels = dayWiseReport.map((item: any) => item?.day);
      const total = dayWiseReport.map((item: any) => item.total);
      const facebook = dayWiseReport.map((item: any) => item.facebook);
      const telegram = dayWiseReport.map((item: any) => item.telegram);
      const whatsapp = dayWiseReport.map((item: any) => item.whatsapp);
      const widget = dayWiseReport.map((item: any) => item.widget);
      setDayWiseData({
        labels,
        total,
        facebook,
        telegram,
        whatsapp,
        widget,
      });
    }
  }, [dayWiseReport]);

  // third grid
  const [dateWiseData, setDateWiseData] = useState<dateWiseType>({
    labels: [],
    total: [],
    facebook: [],
    telegram: [],
    whatsapp: [],
    widget: [],
  });
  useEffect(() => {
    if (dateWiseReport) {
      const labels = dateWiseReport.map((item: any) => item?.date);
      const total = dateWiseReport.map((item: any) => item.total);
      const facebook = dateWiseReport.map((item: any) => item.facebook);
      const telegram = dateWiseReport.map((item: any) => item.telegram);
      const whatsapp = dateWiseReport.map((item: any) => item.whatsapp);
      const widget = dateWiseReport.map((item: any) => item.widget);
      setDateWiseData({
        labels,
        total,
        facebook,
        telegram,
        whatsapp,
        widget,
      });
    }
  }, [dateWiseReport]);

  // fourth grid
  const [dateWiseCompData, setDateWiseCompData] = useState<any>({
    labels: [],
    bot1: [],
    bot2: [],
  });
  useEffect(() => {
    if (dateWiseCompReport) {
      const labels = dateWiseCompReport.map((item: any) => item?.date);
      const bot1 = dateWiseCompReport.map((item: any) => item?.bot1[platform]);
      const bot2 = dateWiseCompReport.map((item: any) => item?.bot2[platform]);
      setDateWiseCompData({
        labels,
        bot1,
        bot2
      });
    }
  }, [dateWiseCompReport,platform]);

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
        getSocialReportDayWise({
          id,
          start: startDate,
          end: endDate,
        }),
      );
    }
  }, [id, startDate, endDate]);

  const [startDateByDateWise, setStartDateByDateWise] = useState<DateType>(null);
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
        getSocialReportDateWise({
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
    if (botCompareId || botCompareId2 || platform) {
      const firstIndex = botsList.find((x:any) => x?.id === botCompareId)?.name || 'Bot 1';;
      const secondIndex = botsList.find((x:any) => x?.id === botCompareId2)?.name || 'Bot 2';
      setBotCompareLabel([ firstIndex+`(${platform})`, secondIndex+`(${platform})` ]);
    }
  }, [botCompareId, botCompareId2, platform]);

  useEffect(() => {
    if (botCompareId || botCompareId2 || endDateForCompare || startDateForCompare) {
      dispatch(
        getSocialReportDateWiseCompare({
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
                  title={<Typography variant="h5">Social Reports</Typography>}
                  subtitle={
                    <Typography variant="body2">Social Reports in details</Typography>
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
              mainLabel={'Total Social'}
              totalValue={donutChartDataTotal}
              title="Social Summary"
            />
          </Grid>

          <Grid item xs={12} md={8}>
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
              total={dayWiseData.total}
              facebook={dayWiseData.facebook}
              telegram={dayWiseData.telegram}
              whatsapp={dayWiseData.whatsapp}
              widget={dayWiseData.widget}
              xLabelText="Conversations"
              yLabelText="Days"
              titleText="Social conversation by days"
              barTitle={['Total', 'Facebook', 'Telegram', 'Whatsapp', 'Widget']}
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
              facebook={dateWiseData.facebook}
              telegram={dateWiseData.telegram}
              whatsapp={dateWiseData.whatsapp}
              widget={dateWiseData.widget}
              xLabelText="Date"
              yLabelText="Conversations Count"
              titleText="Social conversation by dates"
              barTitle={['Total', 'Facebook', 'Telegram', 'Whatsapp', 'Widget']}
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
            <DateWiseCompareReport
              yellow={barChartYellow}
              labelColor={labelColor}
              borderColor={borderColor}
              labels={dateWiseCompData.labels}
              bot1={dateWiseCompData.bot1}
              bot2={dateWiseCompData.bot2}
              xLabelText="Date"
              yLabelText="Conversations Count"
              titleText="Bots comparison by platform"
              barTitle={botCompareLabel}
              platformMenuList={['total', 'facebook', 'telegram', 'whatsapp', 'widget']}
              menuList={botsList}
              inputFieldLabel={'Select Bot'}
              inputFieldLabel2={'Select Platform'}
              startDate={startDateForCompare}
              endDate={endDateForCompare}
              setStartDate={setStartDateForCompare}
              setEndDate={setEndDateForCompare}
              handleOnChange={handleCompareOnChangeByDate}
              platform={platform}
              setPlatform={setPlatform}
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
export default SocialReports;
