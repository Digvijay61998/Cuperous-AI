import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Axios from 'src/helper/Axios';

export const getAllSocialConCount = createAsyncThunk(
  'report/social/conCount',
  async () => {
    try {
      const res = await Axios.get('social/report');
      return res.data;
    } catch (error: any) {
      console.log('AXIOS GET REPORT SOCIAL TOTAL>>>', error);
    }
  },
);

export const getSocialReportDayWise = createAsyncThunk(
  'report/social/day_wise',
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
      if (data?.agentId) {
        queryString += `agentId=${data.agentId}&`;
      }

      const res = await Axios.get(
        `social/report/day-wise${queryString}`,
      );
      return res.data;
    } catch (error: any) {
      console.log('AXIOS ERROR SOCIAL>>>', error);
    }
  },
);

export const getSocialReportDateWise = createAsyncThunk(
  'report/social/date_wise',
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
      if (data?.agentId) {
        queryString += `agentId=${data.agentId}&`;
      }
      const res = await Axios.get(
        `social/report/date-wise${queryString}`,
      );
      return res.data;
    } catch (error: any) {
      console.log('AXIOS ERROR SOCIAL>>>', error);
    }
  },
);

export const getSocialReportDateWiseCompare = createAsyncThunk(
  'report/social/date-wise-comparison',
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
        queryString += `param1=${data.id}&`;
      }
      if (data?.anotherId) {
        queryString += `param2=${data.anotherId}&`;
      }
      const res = await Axios.get(
        `social/report/date-wise-comparison${queryString}`,
      );
      return res.data;
    } catch (error: any) {
      console.log('AXIOS ERROR SOCIAL>>>', error);
    }
  },
);

export const getAllSocialList = createAsyncThunk('list/social', async () => {
  try {
    const res = await Axios.get('social');
    return res.data;
  } catch (error: any) {
    console.log('AXIOS ERROR>>>', error);
  }
});
const socialReport = createSlice({
  name: 'social_report',
  initialState: {
    total: ({} as any) || null,
    dayWiseReport: ([] as any) || null,
    dateWiseReport: ([] as any) || null,
    dateWiseCompReport: ([] as any) || null,
    socialList: ([] as any) || null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getAllSocialConCount.fulfilled, (state, action) => {
      state.total = action.payload;
    });
    builder.addCase(getSocialReportDayWise.fulfilled, (state, action) => {
      state.dayWiseReport = action.payload;
    });
    builder.addCase(getSocialReportDateWise.fulfilled, (state, action) => {
      state.dateWiseReport = action.payload;
    });
    builder.addCase(getSocialReportDateWiseCompare.fulfilled, (state, action) => {
      state.dateWiseCompReport = action.payload;
    });

    builder.addCase(getAllSocialList.fulfilled, (state, action) => {
      state.socialList = action.payload.data;
    });
  },
});

export default socialReport.reducer;
