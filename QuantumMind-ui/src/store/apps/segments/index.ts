// ** Redux Imports
import { Dispatch } from 'redux';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// ** Axios Imports
import Axios from 'src/helper/Axios';

// ** Toasters Imports
import { toast } from 'react-hot-toast'

interface DataParams {
  id?: string;
  skip?: number;
  limit?: number;
  search?: string;
}

interface Redux {
  getState: any;
  dispatch: Dispatch<any>;
}

// ** Fetch Users
export const getsegments = createAsyncThunk(
  'segments/getsegments',
  async () => {
    try {
    const response = await Axios.get('segments');
    return response.data;
    } catch (error: any) {
      console.log("Segment list API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

// ** Fetch visitor
export const fetchVisitorDetail = createAsyncThunk(
  'segment/fetchVisitorDetail',
  async (query: DataParams = {}) => {
    try {
      let urlString = `/segments/${query.id}/visitors`;
      // if (query) {
      //   if (query.skip) {
      //     urlString += `?skip=${query.skip}`;
      //   } else {
      //     urlString += `?`;
      //   }
      //   if (query.limit) {
      //     urlString += `&limit=${query.limit}`;
      //   }
      //   if (query.search) {
      //     urlString += `&text=${query.search}`;
      //   }
      // }
    const response = await Axios.get(urlString);
    const res = response.data.map((data:any) =>{ if(data.visitorId !== null) return data.visitorId});
    const result = res.filter(function( element: any ) {
      return element !== undefined;
    });
    return result;
    } catch (error: any) {
      console.log("Segment's visitor API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);



// ** Add tag
export const addsegment = createAsyncThunk(
  'segment/addSegment',
  async (
    data: { [key: string]: number | string },
    { getState, dispatch }: Redux,
  ) => {
    try {
    const response = await Axios.post('segments', { name: data });

    toast.success("Segment added successfully");
    dispatch(getsegments());
    return response.data;
    } catch (error: any) {
      console.log("New segment add API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

// ** Delete Segment
export const deleteSegment = createAsyncThunk(
  'segments/deleteSegment',
  async (_id: any, { getState, dispatch }: Redux) => {
    try {
    const response = await Axios.delete(`segments/${_id}`);

    toast.success("Segment deleted successfully");
    dispatch(getsegments());
    return response.data;
    } catch (error: any) {
      console.log("Segment delete API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

export const segmentsSlice = createSlice({
  name: 'segments',
  initialState: {
    list: [],
    visitorDataList: {
      list: [],
      count: 0,
    },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getsegments.fulfilled, (state, action) => {
      state.list = action.payload;
    });

    builder.addCase(fetchVisitorDetail.fulfilled, (state, action) => {
      state.visitorDataList.list = action.payload
      state.visitorDataList.count = action.payload?.length || 0;
    });
   
  },
});

export default segmentsSlice.reducer;
