import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Axios from 'src/helper/Axios';

export const getAllWebhookTotal = createAsyncThunk(
  'report/webhook/total',
  async () => {
    try {
      const res = await Axios.get('webhook/report/total');
      return res.data;
    } catch (error: any) {
      console.log('AXIOS GET REPORT BOT TOTAL>>>', error);
    }
  },
);

export const getWebhookReportDayWise = createAsyncThunk(
  'report/webhook/day_wise',
  async (data?: any) => {
    try {
      let queryString = '?';
      if (data?.start) {
        queryString += `startDate=${data.start}&`;
      }
      if (data?.end) {
        queryString += `endDate=${data.end}&`;
      }
      if (data?.id) {
        queryString += `id=${data.id}&`;
      }
        const res = await Axios.get(
          `webhook/report/day-wise-performance${queryString}`,
        );
        return res.data;
      
    } catch (error: any) {
      console.log('AXIOS ERROR>>>', error);
    }
  },
);

export const getWebhookReportDateWise = createAsyncThunk(
  'report/webhook/date_wise',
  async (data?: any) => {
    try {
      let queryString = '?';
      if (data?.start) {
        queryString += `startDate=${data.start}&`;
      }
      if (data?.end) {
        queryString += `endDate=${data.end}&`;
      }
      if (data?.id) {
        queryString += `id=${data.id}&`;
      }
        const res = await Axios.get(
          `webhook/report/date-wise-performance${queryString}`,
        );
        return res.data;
    } catch (error: any) {
      console.log('AXIOS ERROR>>>', error);
    }
  },
);

export const getAllWebhooksList = createAsyncThunk(
  'list/webhooks',
  async () => {
    try {
      const res = await Axios.get('webhook/list');
      return res.data;
    } catch (error: any) {
      console.log('AXIOS ERROR>>>', error);
    }
  },
);
const webhookReport = createSlice({
  name: 'webhook_report',
  initialState: {
    totalWebhook: ({} as any) || null,
    dayWiseReport: ([] as any) || null,
    dateWiseReport: ([] as any) || null,
    webhooksList: ([] as any) || null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getAllWebhookTotal.fulfilled, (state, action) => {
      state.totalWebhook = action.payload;
    });
    builder.addCase(getWebhookReportDayWise.fulfilled, (state, action) => {
      state.dayWiseReport = action.payload;
    });

    builder.addCase(getWebhookReportDateWise.fulfilled, (state, action) => {
      state.dateWiseReport = action.payload;
    });
    builder.addCase(getAllWebhooksList.fulfilled, (state, action) => {
      state.webhooksList = action.payload;
    });
  },
});

export default webhookReport.reducer;
