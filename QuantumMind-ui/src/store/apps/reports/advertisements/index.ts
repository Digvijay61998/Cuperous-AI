import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Axios from 'src/helper/Axios';

export const getAllAdsTotal = createAsyncThunk(
  'report/advertisement/total',
  async () => {
    try {
      const res = await Axios.get('advertisement/report/count');
      return res.data;
    } catch (error: any) {
      console.log('AXIOS GET REPORT ADS TOTAL>>>', error);
    }
  },
);

export const getAllAdsByBot = createAsyncThunk(
  'report/advertisement/by_bot',
  async (data?: any) => {
    try {
      let queryString = '?';
      if (data?.skip) {
        queryString += `skip=${data.skip}&`;
      }
      if (data?.limit) {
        queryString += `limit=${data.limit}&`;
      }
      if (data?.status) {
        queryString += `status=${data.status}&`;
      }
      if (data?.bot) {
        queryString += `bot=${data.bot}&`;
      }

      const res = await Axios.get(
        `advertisement/report/bots-total-clicks${queryString}`,
      );
      return res.data;
    } catch (error: any) {
      console.log('AXIOS ERROR>>>', error);
    }
  },
);

export const getAllAdsByTag = createAsyncThunk(
  'report/advertisement/by_tag',
  async (data?: any) => {
    try {
      let queryString = '?';
      if (data?.skip) {
        queryString += `skip=${data.skip}&`;
      }
      if (data?.limit) {
        queryString += `limit=${data.limit}&`;
      }
      if (data?.status) {
        queryString += `status=${data.status}&`;
      }
      if (data?.bot) {
        queryString += `bot=${data.bot}&`;
      }

      const res = await Axios.get(
        `advertisement/report/tags-total-clicks${queryString}`,
      );
      return res.data;
    } catch (error: any) {
      console.log('AXIOS ERROR>>>', error);
    }
  },
);

export const getAdsReportWeekWise = createAsyncThunk(
  'report/advertisement/day_wise',
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
        queryString += `advertisementId=${data.id}&`;
      }

      const res = await Axios.get(
        `advertisement/report/day-wise-performance${queryString}`,
      );
      return res.data;
    } catch (error: any) {
      console.log('AXIOS ERROR>>>', error);
    }
  },
);

export const getAdsReportDateWise = createAsyncThunk(
  'report/advertisement/date_wise',
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
        queryString += `advertisementId=${data.id}&`;
      }
      const res = await Axios.get(
        `advertisement/report/date-wise-performance${queryString}`,
      );
      return res.data;
    } catch (error: any) {
      console.log('AXIOS ERROR>>>', error);
    }
  },
);

export const getAdsReportDateWiseCompare = createAsyncThunk(
  'report/advertisement/date_wise_compare',
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
        `advertisement/report/date-wise-compare${queryString}`,
      );
      return res.data;
    } catch (error: any) {
      console.log('AXIOS ERROR>>>', error);
    }
  },
);

export const getAllAdsList = createAsyncThunk('list/advertisements', async () => {
  try {
    const res = await Axios.get('advertisement');
    return res.data;
  } catch (error: any) {
    console.log('AXIOS ERROR>>>', error);
  }
});
const advertisementsReport = createSlice({
  name: 'advertisements_report',
  initialState: {
    total: ({} as any) || null,
    totalByBot: ({} as any) || null,
    totalByTag: ({} as any) || null,
    weekWiseReport: ([] as any) || null,
    dateWiseReport: ([] as any) || null,
    dateWiseCompReport: ([] as any) || null,
    adsList: ([] as any) || null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getAllAdsTotal.fulfilled, (state, action) => {
      state.total = action.payload;
    });
    builder.addCase(getAllAdsByBot.fulfilled, (state, action) => {
      state.totalByBot = action.payload;
    });
    builder.addCase(getAllAdsByTag.fulfilled, (state, action) => {
      state.totalByTag = action.payload;
    });
    builder.addCase(getAdsReportWeekWise.fulfilled, (state, action) => {
      state.weekWiseReport = action.payload;
    });
    builder.addCase(getAdsReportDateWise.fulfilled, (state, action) => {
      state.dateWiseReport = action.payload;
    });
    builder.addCase(getAdsReportDateWiseCompare.fulfilled, (state, action) => {
      state.dateWiseCompReport = action.payload;
    });
    builder.addCase(getAllAdsList.fulfilled, (state, action) => {
      state.adsList = action.payload.data;
    });
  },
});

export default advertisementsReport.reducer;
