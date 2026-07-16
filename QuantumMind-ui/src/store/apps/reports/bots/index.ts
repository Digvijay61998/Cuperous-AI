import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Axios from 'src/helper/Axios';

export const getAllBotsTotal = createAsyncThunk(
  'report/bot/total',
  async () => {
    try {
      const res = await Axios.get('bots/report/total');
      return res.data;
    } catch (error: any) {
      console.log('AXIOS GET REPORT BOT TOTAL>>>', error);
    }
  },
);

export const getBotReportDayWise = createAsyncThunk(
  'report/bot/day_wise',
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
        `bots/report/day-wise-performance${queryString}`,
      );
      return res.data;
    } catch (error: any) {
      console.log('AXIOS ERROR>>>', error);
    }
  },
);

export const getBotReportDateWise = createAsyncThunk(
  'report/bot/date_wise',
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
        `bots/report/date-wise-performance${queryString}`,
      );
      return res.data;
    } catch (error: any) {
      console.log('AXIOS ERROR>>>', error);
    }
  },
);

export const getAllBotsList = createAsyncThunk('list/bots', async () => {
  try {
    const res = await Axios.get('bots/list');
    return res.data;
  } catch (error: any) {
    console.log('AXIOS ERROR>>>', error);
  }
});
const botReport = createSlice({
  name: 'bot_report',
  initialState: {
    total: ({} as any) || null,
    dayWiseReport: ([] as any) || null,
    dateWiseReport: ([] as any) || null,
    botsList: ([] as any) || null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getAllBotsTotal.fulfilled, (state, action) => {
      state.total = action.payload;
    });
    builder.addCase(getBotReportDayWise.fulfilled, (state, action) => {
      state.dayWiseReport = action.payload;
    });
    builder.addCase(getBotReportDateWise.fulfilled, (state, action) => {
      state.dateWiseReport = action.payload;
    });

    builder.addCase(getAllBotsList.fulfilled, (state, action) => {
      state.botsList = action.payload;
    });
  },
});

export default botReport.reducer;
