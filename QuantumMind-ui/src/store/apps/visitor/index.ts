// ** Redux Imports
import { Dispatch } from 'redux';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// ** Axios Imports
import Axios from 'src/helper/Axios';

// ** Toasters Imports
import { toast } from 'react-hot-toast';

interface DataParams {
  skip?: number;
  limit?: number;
  search?: string;
  bot?: string;
  status?: string;
  startDate?: any;
  endDate?: any;
}

interface Redux {
  getState: any;
  dispatch: Dispatch<any>;
}

// ** Fetch visitor
export const getvisitor = createAsyncThunk(
  'visitor/getvisitor',
  async (query: DataParams = {}) => {
    try {
      let urlString = 'visitor';
      if (query) {
        if (query.skip) {
          urlString += `?skip=${query.skip}`;
        } else {
          urlString += `?`;
        }
        if (query.limit) {
          urlString += `&limit=${query.limit}`;
        }
        if (query.status) {
          urlString += `&status=${query.status}`;
        }
        if (query.startDate) {
          urlString += `&startDate=${query.startDate}`;
        }
        if (query.endDate) {
          urlString += `&endDate=${query.endDate}`;
        }
        if (query.bot) {
          urlString += `&bot=${query.bot}`;
        }
        if (query.search) {
          urlString += `&text=${query.search}`;
        }
      }

      const response = await Axios.get(urlString);
      return response.data;
    } catch (error: any) {
      console.log('Visitor list API:Error >>>>', error);
      // toast.error(error.response.data.message || error.message || error);
    }
  },
);

// export const fetchVisitorDetail = createAsyncThunk(
//   'visitor/fetchVisitorDetail',
//   async(id: any) => {
//     const response = await Axios.get(`visitor/${id}`)
//     return response.data
//   }
// )

// ** Fetch Visitors Details By Visitor ID
export const fetchVisitorDetail = createAsyncThunk(
  'visitor/fetchVisitorDetail',
  async (visitorId: string | any) => {
    try {
      const response = await Axios.get(`/visitor/${visitorId}/`);
      return response.data;
    } catch (error: any) {
      console.log('Visitor detail API:Error >>>>', error);
      // toast.error(error.response.data.message || error.message || error);
    }
  },
);

export const fetchVisitorFeedback = createAsyncThunk(
  'visitor/fetchVisitorFeedback',
  async (visitorId: string | any) => {
    try {
      const response = await Axios.get(`/feedback/${visitorId}/`);
      return response.data;
    } catch (error: any) {
      console.log('Visitor Feedback API:Error >>>>', error);
    }
  },
);

// get segment by id
export const getSegmentsById = createAsyncThunk(
  'segment/getSegmentsById',
  async (id: string | any) => {
    try {
      const response = await Axios.get(`segments/${id}`);
      return response.data;
    } catch (error: any) {
      console.log('Segment by id API:Error >>>>', error);
      // toast.error(error.response.data.message || error.message || error);
    }
  },
);


export const handleBlockVisitor= async (id: string | any) => {
  try {
    const response = await Axios.post(`visitor/${id}/block`);
    toast.success('Visitor blocked successfully');
    return response.data;
  } catch (error: any) {
    console.log('Clock visitor API:Error >>>>', error);
    // toast.error(error.response.data.message || error.message || error);
  }
}



// Add visitor to segment
export const addVisitorToSegment = createAsyncThunk(
  'segment/addVisitorToSegment',
  async (data: any, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.post(
        `/segments/${data.segmentId}/add-visitor`,
        { visitorId: data.visitorId },
      );
      toast.success('Visitor added to segment successfully');
      dispatch(getSegmentsById(data.visitorId));
      return response.data;
    } catch (error: any) {
      console.log('Add visitor to segment API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

// Remove visitor from segment
export const removeVisitorFromSegment = createAsyncThunk(
  'segment/removeVisitorFromSegment',
  async (data: any, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.post(
        `/segments/${data.segmentId}/remove-visitor`,
        { visitorId: data.visitorId },
      );
      toast.success('Visitor removed from segment successfully');
      dispatch(getSegmentsById(data.visitorId));
      return response.data;
    } catch (error: any) {
      console.log('Remove visitor from segment API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

// ** Delete Segment
export const deleteSegment = createAsyncThunk(
  'segments/deletesegment',
  async (_id: any, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.delete(`segments/${_id}`);

      toast.success('Segment deleted successfully');
      dispatch(getSegmentsById(_id));
      return response.data;
    } catch (error: any) {
      console.log('Segment delete API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

export const visitorSlice = createSlice({
  name: 'visitor',
  initialState: {
    search: {},
    list: [],
    listCount: 0,
    visitorDataList: {} as any,
    visitorDataListDeep: [{}],
    visitorDataListServiceRequest: [],
    visitorDataListBotDetails: {},
    feedbackList: [] as any,
    conversationId: null,
    segmentList: [] as any,
    deviceDetails: null as any,
    conversations: [] as any
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getvisitor.fulfilled, (state, action) => {
      state.search = action.payload.search;
      state.list = action.payload.data;
      state.listCount = action.payload.count;
    });

    builder.addCase(fetchVisitorDetail.fulfilled, (state, action) => {
      state.visitorDataList = action.payload;
      state.visitorDataListDeep = action.payload?.visitorDetails;
      state.visitorDataListServiceRequest = action.payload?.serviceRequests;
      state.visitorDataListBotDetails = action.payload?.bot;
      state.conversationId = action.payload?.conversations[0];
      state.deviceDetails = action.payload?.details;
      state.conversations = action.payload?.conversations;
    });
    builder.addCase(fetchVisitorFeedback.fulfilled, (state, action) => {
      state.feedbackList = action.payload;
    });
    builder.addCase(getSegmentsById.fulfilled, (state, action) => {
      state.segmentList = action.payload;
    });
  },
});

export default visitorSlice.reducer;
