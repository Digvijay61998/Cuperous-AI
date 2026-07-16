import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-hot-toast';
import Axios from 'src/helper/Axios';

export const getAllSegmentsTotal = createAsyncThunk(
  'report/segments/total',
  async () => {
    try {
      const res = await Axios.get('segments/report/count');
      return res.data;
    } catch (error: any) {
      console.log('AXIOS GET REPORT SEGMENT TOTAL>>>', error);
    }
  },
);

export const getSegmentsReportWeekWise = createAsyncThunk(
  'report/segments/day-wise',
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
        queryString += `segmentId=${data.id}&`;
      }
      if (data?.compareId) {
        queryString += `compareSegmentId=${data.compareId}&`;
      }

      const res = await Axios.get(
        `segments/report/day-wise-performance${queryString}`,
      );
      return res.data;
    } catch (error: any) {
      console.log('AXIOS ERROR SEGMENT>>>', error);
    }
  },
);

export const getSegmentsReportDateWise = createAsyncThunk(
  'report/segments/date_wise',
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
        queryString += `segmentId=${data.id}&`;
      }
      if (data?.compareId) {
        queryString += `compareSegmentId=${data.compareId}&`;
      }
      const res = await Axios.get(
        `segments/report/date-wise-performance${queryString}`,
      );
      return res.data;
    } catch (error: any) {
      console.log('AXIOS ERROR SEGMENT>>>', error);
    }
  },
);

export const getSegmentsReportDateWiseCompare = createAsyncThunk(
  'report/segments/date_wise_compare',
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
      if (data?.compareId) {
        queryString += `param2=${data.compareId}&`;
      }
      const res = await Axios.get(
        `segments/report/date-wise-compare${queryString}`,
      );
      return res.data;
    } catch (error: any) {
      console.log('AXIOS ERROR SEGMENT>>>', error);
    }
  },
);

export const getAllSegmentsList = createAsyncThunk(
  'list/segments',
  async () => {
    try {
      const res = await Axios.get('segments');
      return res.data;
    } catch (error: any) {
      console.log('Segment list API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

const segmentsReport = createSlice({
  name: 'segments_report',
  initialState: {
    total: ({} as any) || null,
    weekWiseReport: ([] as any) || null,
    dateWiseReport: ([] as any) || null,
    dateWiseCompareReport: ([] as any) || null,
    segmentsList: ([] as any) || null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getAllSegmentsTotal.fulfilled, (state, action) => {
      state.total = action.payload;
    });
    builder.addCase(getSegmentsReportWeekWise.fulfilled, (state, action) => {
      state.weekWiseReport = action.payload;
    });
    builder.addCase(getSegmentsReportDateWise.fulfilled, (state, action) => {
      state.dateWiseReport = action.payload;
    });
    builder.addCase(
      getSegmentsReportDateWiseCompare.fulfilled,
      (state, action) => {
        state.dateWiseCompareReport = action.payload;
      },
    );

    builder.addCase(getAllSegmentsList.fulfilled, (state, action) => {
      state.segmentsList = action.payload;
    });
  },
});

export default segmentsReport.reducer;
