// ** Redux Imports
import { Dispatch } from 'redux'
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Custom Axios Imports
import Axios from 'src/helper/Axios'

// ** Toasters Imports
import { toast } from 'react-hot-toast'

interface Redux {
  getState?: any,
  dispatch: Dispatch<any>
}

interface updateVideoInterface {
  id: number | string,
  data: any
}

type filterListProps = {
  skip?: number;
  limit?: number;
  search?: string;
  status?: 'live' | 'draft' | string | undefined;
  category?: string | undefined;
}


// ** Fetch video 
export const fetchVideo = createAsyncThunk(
  'video', 
  async(query:filterListProps = {}) => {
    try {
        let urlString = 'video';
        if (query) {
          if (query.skip || query.skip==0) {
            urlString += `?skip=${query.skip}`;
          } else {
            urlString += `?`;
          }
          if (query.limit) {
            urlString += `&limit=${query.limit}`;
          }
          if (query.search) {
            urlString += `&text=${query.search}`;
          }
          if (query.status) {
            urlString += `&status=${query.status}`;
          }
          if(query.category) {
            urlString += `&category=${query.category}`;
          }
        }
      const response = await Axios.get(urlString)
      return response.data
    } catch (error: any) {
      console.log("Video detail API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)

// ** search Category
export const fetchVideoCategory = createAsyncThunk(
  'video/Category', 
  async(query:filterListProps = {}) => {
    try {
        let urlString = 'video/params';
      const response = await Axios.get(urlString)
      return response.data
    } catch (error: any) {
      console.log("VideoCategory detail API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)

export const addVideoViewCount = createAsyncThunk(
  'video/viewCount', 
  async(query:string = '') => {
    try {
        // let urlString = '/video/increment-view-count/';
        // if (query) {
        //   if (query._id) {
        //     console.log('query._id:::',query)
        //     urlString += `${query}`;
        //   }
        // }
      const response = await Axios.get(`video/increment-view-count/${query}`)
      return response.data
    } catch (error: any) {
      console.log("Video detail API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)
// ** Add new video
export const addNewVideo = createAsyncThunk(
  'video/addNewVideo',
  async(data: any, { getState, dispatch }: Redux) => {
    
    try {
      const response = await Axios.post('video',data)
      toast.success("New Video added successfully");
      dispatch(fetchVideo())
      return response.data
    } catch (error: any) {
      console.log("Add new Video API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)

// ** Fetch Question Bank Detail
export const fetchVideoDetail = createAsyncThunk(
  'video/fetchVideoDetail', 
  async(id: any) => {
    try {
      const response = await Axios.get(`video/${id}`)
      return response.data
    } catch (error: any) {
      console.log("Video detail API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)
// ** Update specific video
export const updateVideo = createAsyncThunk(
  'video/updateVideo',
  async ({ id, data }:updateVideoInterface, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.patch(`video/${id}`,data)
      
      toast.success("Video updated successfully");
      dispatch(fetchVideoDetail(id))
      dispatch(fetchVideo())
      return response.data
    } catch (error: any) {
      console.log("Update Video API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)
// ** Delete Video
export const deleteVideo = createAsyncThunk(
  'video/deleteVideo',
  async (id: number | string, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.delete(`video/${id}`)
      
      toast.success("Video deleted successfully");
      dispatch(fetchVideo())
      return response.data
    } catch (error: any) {
      console.log("Delete Video API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)

export const videoSlice = createSlice({
  name: 'video',
  initialState: {
    vidoListData: {
      data: [],
      count: 0,
    },
    videoCategory:{
      data:[],
      status:[]
    },
    selectedVideoDetail : {} as any
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchVideo.fulfilled, (state, action) => {
      state.vidoListData.data = action.payload?.data
      state.vidoListData.count = action.payload?.count
    })
    builder.addCase(fetchVideoCategory.fulfilled, (state, action) => {
      state.videoCategory.data = action?.payload?.categories
      state.videoCategory.status = action?.payload?.status
    })
    builder.addCase(fetchVideoDetail.fulfilled, (state, action) => {
      state.selectedVideoDetail = action.payload
    })
    
  }
})

export default videoSlice.reducer