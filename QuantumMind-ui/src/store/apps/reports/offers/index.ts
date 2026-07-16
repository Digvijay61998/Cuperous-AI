import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Axios from 'src/helper/Axios';

export const getAllOffersTotal = createAsyncThunk(
  'report/offer/total',
  async () => {
    try {
      const res = await Axios.get('offer/report/count');
      return res.data;
    } catch (error: any) {
      console.log('AXIOS GET REPORT OFFERS TOTAL>>>', error);
    }
  },
);

export const getAllOffersByBot = createAsyncThunk(
  'report/offer/by_bot',
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
        `offer/report/bots-total-clicks${queryString}`,
      );
      return res.data;
    } catch (error: any) {
      console.log('AXIOS ERROR>>>', error);
    }
  },
);

export const getAllOffersByTag = createAsyncThunk(
  'report/offer/by_tag',
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
        `offer/report/tags-total-clicks${queryString}`,
      );
      return res.data;
    } catch (error: any) {
      console.log('AXIOS ERROR>>>', error);
    }
  },
);

export const getOffersReportWeekWise = createAsyncThunk(
  'report/offer/day_wise',
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
        queryString += `offerId=${data.id}&`;
      }

      const res = await Axios.get(
        `offer/report/day-wise-performance${queryString}`,
      );
      return res.data;
    } catch (error: any) {
      console.log('AXIOS ERROR>>>', error);
    }
  },
);

export const getOffersReportDateWise = createAsyncThunk(
  'report/offer/date_wise',
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
        queryString += `offerId=${data.id}&`;
      }
      const res = await Axios.get(
        `offer/report/date-wise-performance${queryString}`,
      );
      return res.data;
    } catch (error: any) {
      console.log('AXIOS ERROR>>>', error);
    }
  },
);

export const getOffersReportDateWiseCompare = createAsyncThunk(
  'report/offer/date_wise_compare',
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
        `offer/report/date-wise-compare${queryString}`,
      );
      return res.data;
    } catch (error: any) {
      console.log('AXIOS ERROR>>>', error);
    }
  },
);

export const getAllOffersList = createAsyncThunk('list/offers', async () => {
  try {
    const res = await Axios.get('offer');
    return res.data;
  } catch (error: any) {
    console.log('AXIOS ERROR>>>', error);
  }
});
const offersReport = createSlice({
  name: 'offers_report',
  initialState: {
    total: ({} as any) || null,
    totalByBot: ({} as any) || null,
    totalByTag: ({} as any) || null,
    weekWiseReport: ([] as any) || null,
    dateWiseReport: ([] as any) || null,
    dateWiseCompReport: ([] as any) || null,
    offersList: ([] as any) || null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getAllOffersTotal.fulfilled, (state, action) => {
      state.total = action.payload;
    });
    builder.addCase(getAllOffersByBot.fulfilled, (state, action) => {
      state.totalByBot = action.payload;
    });
    builder.addCase(getAllOffersByTag.fulfilled, (state, action) => {
      state.totalByTag = action.payload;
    });
    builder.addCase(getOffersReportWeekWise.fulfilled, (state, action) => {
      state.weekWiseReport = action.payload;
    });
    builder.addCase(getOffersReportDateWise.fulfilled, (state, action) => {
      state.dateWiseReport = action.payload;
    });
    builder.addCase(getOffersReportDateWiseCompare.fulfilled, (state, action) => {
      state.dateWiseCompReport = action.payload;
    });
    builder.addCase(getAllOffersList.fulfilled, (state, action) => {
      state.offersList = action.payload.data;
    });
  },
});

export default offersReport.reducer;