import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Axios from 'src/helper/Axios';
import { toast } from 'react-hot-toast';
import { Dispatch } from 'redux';

export const getWorkedSummary = createAsyncThunk(
  'dashboard/getWorkedSummary',
  async () => {
    try {
      const response = await Axios.get('agent/welcome');
      return response.data;
    } catch (error: any) {
      console.log('Work summary API:Error >>>>', error);
      
    }
  },
);

export const getVisitorSummaryReport = createAsyncThunk(
  'dashboard/getVisitorSummaryReport',
  async () => {
    try {

      const response = await Axios.get(
        `visitor/report/month-wise`,
      );
      return response.data;
    } catch (error: any) {
      console.log('Visitor summary report API:Error >>>>', error);
      
    }
  },
);

// get total visitors   by current

export const getTotalVisitorsByCurrent = createAsyncThunk(
  'dashboard/getTotalVisitorsByCurrent',
  async (query: any = {}) => {
    try {
      let queryString = '?';
      if (query?.time) {
        queryString += `time=${query?.time}&`;
      }
      const response = await Axios.get(
        `visitor/stat/home${queryString}`,
      );
      return response.data;
    } catch (error: any) {
      console.log('Total visitors by current API:Error >>>>', error);
      
    }
  },
);

export const getTotalConversationByCurrent = createAsyncThunk(
  'dashboard/getTotalConversationByCurrent',
  async (query: any = {}) => {
    try {
      let queryString = '?';
      if (query?.time) {
        queryString += `time=${query.time}&`;
      }

      const response = await Axios.get(
        `conversation/stats/home${queryString}`,
      );
      return response.data;
    } catch (error: any) {
      console.log('Total conversation by current API:Error >>>>', error);
      
    }
  },
);

// total request
export const getTotalRequestByCurrent = createAsyncThunk(
  'dashboard/getTotalRequestByCurrent',
  async (query: any = {}) => {
    try {
      let queryString = '?';
      if (query?.time) {
        queryString += `time=${query.time}&`;
      }

      const response = await Axios.get(
        `tickets/stats/home${queryString}`,
      );
      return response.data;
    } catch (error: any) {
      console.log('Total requests by current API:Error >>>>', error);
      
    }
  },
);

//   Pending Request
export const getPendingRequestByCurrent = createAsyncThunk(
  'dashboard/getPendingRequestByCurrent',
  async (query: any = {}) => {
    try {
      let queryString = '?';
      if (query?.time) {
        queryString += `time=${query?.time}&`;
      }
      const response = await Axios.get(
        `tickets/stats/home/pending${queryString}`,
      );
      return response.data;
    } catch (error: any) {
      console.log('Pending requests by current API:Error >>>>', error);
      
    }
  },
);

// Blocked Conversation
export const getBlockedConversationByCurrent = createAsyncThunk(
  'dashboard/getBlockedConversationByCurrent',
  async (query: any = {}) => {
    try {
      let queryString = '?';
      if (query?.time) {
        queryString += `time=${query?.time}&`;
      }
      const response = await Axios.get(
        `conversation/stats/home/blocked${queryString}`,
      );
      return response.data;
    } catch (error: any) {
      console.log('Blocked conversation by current API:Error >>>>', error);
      
    }
  },
);

// unanswered questions
export const getUnansweredQuestionsByCurrent = createAsyncThunk(
  'dashboard/getUnansweredQuestionsByCurrent',
  async (query: any = {}) => {
    try {
      let queryString = '?';
      if (query?.time) {
        queryString += `time=${query?.time}&`;
      }
      const response = await Axios.get(
        `unanswered/stats/home${queryString}`,
      );
      return response.data;
    } catch (error: any) {
      console.log('Unanswered questions by current API:Error >>>>', error);
      
    }
  },
);

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    loading: false,
    error: null,
    workedSummary: {} as any | null,
    visitorsSummary: {} as any | null,
    totalConversationByCurrent: {} as any | null,
    totalVisitorsByCurrent: {} as any | null,
    totalRequestsByCurrent: {} as any | null,
    pendingRequestsByCurrent: {} as any | null,
    blockedConversationByCurrent: {} as any | null,
    unansweredQuestionsByCurrent: {} as any | null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getWorkedSummary.fulfilled, (state, action) => {
      state.workedSummary = action.payload;
    });
    builder.addCase(getVisitorSummaryReport.fulfilled, (state, action) => {
      state.visitorsSummary = action.payload;
    });
    builder.addCase(
      getTotalConversationByCurrent.fulfilled,
      (state, action) => {
        state.totalConversationByCurrent = action.payload;
      },
    );
    builder.addCase(getTotalVisitorsByCurrent.fulfilled, (state, action) => {
      state.totalVisitorsByCurrent = action.payload;
    });
    builder.addCase(getTotalRequestByCurrent.fulfilled, (state, action) => {
      state.totalRequestsByCurrent = action.payload;
    });
    builder.addCase(getPendingRequestByCurrent.fulfilled, (state, action) => {
      state.pendingRequestsByCurrent = action.payload;
    });
    builder.addCase(
      getBlockedConversationByCurrent.fulfilled,
      (state, action) => {
        state.blockedConversationByCurrent = action.payload;
      },
    );
    builder.addCase(
      getUnansweredQuestionsByCurrent.fulfilled,
      (state, action) => {
        state.unansweredQuestionsByCurrent = action.payload;
      },
    );
  },
});

export default dashboardSlice.reducer;
