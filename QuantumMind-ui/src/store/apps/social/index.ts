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

interface updateSocialInterface {
  id: number | string,
  data: any
}

type filterListProps = {
  skip?: number;
  limit?: number;
  platform?: "facebook" | "telegram" | "whatsapp" | string | undefined;
  status?: "published" | "draft" | string | undefined;
  bot?: string;
}

// ** Fetch social list
export const fetchSocialList = createAsyncThunk(
  'social/fetchSocialList', 
  async(query:filterListProps = {}) => {
    try {
      let urlString = 'social';
      if (query) {
        if (query.skip) {
          urlString += `?skip=${query.skip}`;
        } else {
          urlString += `?`;
        }
        if (query.limit) {
          urlString += `&limit=${query.limit}`;
        }
        if (query.platform) {
          urlString += `&platform=${query.platform}`;
        }
        if (query.status) {
          urlString += `&status=${query.status}`;
        }
        if (query.bot) {
          urlString += `&bot=${query.bot}`;
        }
          
      }

      const response = await Axios.get(urlString);
      return response.data
    } catch (error: any) {
      console.log("Social list API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)
// ** Fetch Social Detail
export const fetchSocialDetail = createAsyncThunk(
  'social/fetchSocialDetail', 
  async(id: any) => {
    try {
      const response = await Axios.get(`social/${id}`)
      return response.data
    } catch (error: any) {
      console.log("Social detail API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)
// ** Add new social
export const addNewSocial = createAsyncThunk(
  'social/addNewSocial',
  async(data: any, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.post('social',data)
      
      toast.success("Social added successfully");
      dispatch(fetchSocialList())
      return response.data
    } catch (error: any) {
      console.log("Add new social API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)
// ** Update specific social
export const updateSocial = createAsyncThunk(
  'social/updateSocial',
  async ({ id, data }:updateSocialInterface, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.patch(`social/${id}`,data)
      
      toast.success("Social updated successfully");
      dispatch(fetchSocialDetail(id))
      dispatch(fetchSocialList())
      return response.data
    } catch (error: any) {
      console.log("Update social API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)
// ** Update specific social status
export const updateSocialStatus = createAsyncThunk(
  'social/updateSocial',
  async ({ id, data }:updateSocialInterface, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.patch(`social/${id}/update-status`,data)
      
      toast.success("Status updated successfully");
      dispatch(fetchSocialDetail(id))
      dispatch(fetchSocialList())
      return response.data
    } catch (error: any) {
      console.log("Update social status API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)
// ** Delete social
export const deleteSocial = createAsyncThunk(
  'social/deleteSocial',
  async (id: number | string, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.delete(`social/${id}`)
      
      toast.success("Social deleted successfully");
      dispatch(fetchSocialList())
      return response.data
    } catch (error: any) {
      console.log("Delete social API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)

export const socialSlice = createSlice({
  name: 'social',
  initialState: {
    socialListCount: 0,
    socialListData: [],
    socialListSearch: {} as any,
    selectedSocialData: {},
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchSocialList.fulfilled, (state, action) => {
      state.socialListData = action.payload.data
      state.socialListCount = action.payload.count
      state.socialListSearch = action.payload.search
    })
    builder.addCase(fetchSocialDetail.fulfilled, (state, action) => {
      state.selectedSocialData = action.payload
    })
  }
})

export default socialSlice.reducer
