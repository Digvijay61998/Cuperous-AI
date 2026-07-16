import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Axios from 'src/helper/Axios';

export const getAllAgentTotal = createAsyncThunk(
  'report/agent/total',
  async () => {
    try {
      const res = await Axios.get('agent/report/total');
      return res.data;
    } catch (error: any) {
      console.log('AXIOS GET REPORT AGENT TOTAL>>>', error);
    }
  },
);

export const getAgentReportDayWise = createAsyncThunk(
  'report/agent/day_wise',
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
          `agent/report/day-wise-performance${queryString}`,
        );
        return res.data;
      
    } catch (error: any) {
      console.log('AXIOS ERROR>>>', error);
    }
  },
);

export const getAgentReportDateWise = createAsyncThunk(
  'report/agent/date_wise',
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
          `agent/report/date-wise-performance${queryString}`,
        );
        return res.data;
      
    } catch (error: any) {
      console.log('AXIOS ERROR>>>', error);
    }
  },
);

export const getAllAgentsList = createAsyncThunk('list/agent', async () => {
  try {
    const res = await Axios.get('agent/list');
    return res.data;
  } catch (error: any) {
    console.log('AXIOS ERROR>>>', error);
  }
});

const agentReport = createSlice({
  name: 'agent_report',
  initialState: {
    agentSummaryTotal: {} as any,
    agentDayWiseReport: ([] as any) || null,
    agentDateWiseReport: ([] as any) || null,
    agentList: ([] as any) || null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getAllAgentTotal.fulfilled, (state, action) => {
      state.agentSummaryTotal = action.payload;
    });
    builder.addCase(getAgentReportDayWise.fulfilled, (state, action) => {
      state.agentDayWiseReport = action.payload;
    });
    builder.addCase(getAgentReportDateWise.fulfilled, (state, action) => {
      state.agentDateWiseReport = action.payload;
    });

    builder.addCase(getAllAgentsList.fulfilled, (state, action) => {
      state.agentList = action.payload;
    });
  },
});

export default agentReport.reducer;
