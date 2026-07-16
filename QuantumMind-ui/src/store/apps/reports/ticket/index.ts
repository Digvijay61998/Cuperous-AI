import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Axios from 'src/helper/Axios';

export const getAllTicketsTotal = createAsyncThunk(
  'report/tickets/total',
  async () => {
    try {
      const res = await Axios.get('tickets/report/total');
      return res.data;
    } catch (error: any) {
      console.log('AXIOS GET REPORT>>>', error);
    }
  },
);

export const getTicketsReportDayWise = createAsyncThunk(
  'report/tickets/day_wise',
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
          `tickets/report/day-wise-performance${queryString}`,
        );
        return res.data;
      
    } catch (error: any) {
      console.log('AXIOS ERROR>>>', error);
    }
  },
);

export const getTicketsReportDateWise = createAsyncThunk(
  'report/tickets/date_wise',
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
          `tickets/report/date-wise-performance${queryString}`,
        );
        return res.data;
      
    } catch (error: any) {
      console.log('AXIOS ERROR>>>', error);
    }
  },
);
const ticketsReport = createSlice({
  name: 'tickets_report',
  initialState: {
    ticketsTotal: {} as any,
    ticketsDayWiseReport: [] as any,
    ticketsDateWiseReport: [] as any,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getAllTicketsTotal.fulfilled, (state, action) => {
      state.ticketsTotal = action.payload;
    });
    builder.addCase(getTicketsReportDayWise.fulfilled, (state, action) => {
      state.ticketsDayWiseReport = action.payload;
    });
    builder.addCase(getTicketsReportDateWise.fulfilled, (state, action) => {
      state.ticketsDateWiseReport = action.payload;
    });
  },
});

export default ticketsReport.reducer;
