import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { AnyAaaaRecord } from 'dns';
import Axios from 'src/helper/Axios';

export const getAllVisitorsTotal = createAsyncThunk(
  'report/visitor/total',
  async () => {
    try {
      const res = await Axios.get('visitor/report/total');
      return res.data;
    } catch (error: any) {
      console.log('AXIOS GET REPORT  TOTAL>>>', error);
    }
  },
);

export const getAllVisitorsDetails = createAsyncThunk(
  'report/visitor/details',
  async () => {
    try {
      const res = await Axios.get('visitor/report/details');
      return res.data;
    } catch (error: any) {
      console.log('AXIOS GET REPORT  TOTAL>>>', error);
    }
  },
);

export const getVisitorsHandledByBots = createAsyncThunk(
  'report/visitor/handled-by-bots',
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
      const res = await Axios.get(`visitor/report/total/handel-by-bot${queryString}`);
      return res.data;
     
    } catch (error: any) {
      console.log('AXIOS GET REPORT  TOTAL>>>', error);
    }
  },
);

export const getVisitorsHandledByAgent = createAsyncThunk(
  'report/visitor/handled-by-agent',
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
      const res = await Axios.get(`visitor/report/total/handel-by-agent${queryString}`);
      return res.data;
    } catch (error: any) {
      console.log('AXIOS GET REPORT  TOTAL>>>', error);
    }
  },
);

const visitorsReport = createSlice({
  name: 'visitors_report',
  initialState: {
    totalVisitors: {} as any,
    visitorsDetails : {} as any || null,
    handledByBots: [] as any || null ,
    handledByAgents: [] as any || null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getAllVisitorsTotal.fulfilled, (state, action) => {
      state.totalVisitors = action.payload;
    })
    builder.addCase(getAllVisitorsDetails.fulfilled, (state, action) => {
      state.visitorsDetails = action.payload
    })

    builder.addCase(getVisitorsHandledByBots.fulfilled, (state, action) => {
      state.handledByBots = action.payload
    })

    builder.addCase(getVisitorsHandledByAgent.fulfilled, (state, action) => {
      state.handledByAgents= action.payload
    })
  },
});

export default visitorsReport.reducer;
