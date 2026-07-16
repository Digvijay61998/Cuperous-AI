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

interface updateAdsInterface {
  id: number | string,
  data: any
}

type filterListProps = {
  skip?: number;
  limit?: number;
  status?: 'published' | 'draft' | '' | string | undefined;
  bot?: string;
}

// ** Fetch Advertisement list
export const fetchAdsList = createAsyncThunk(
  'advertisement/fetchAdsList', 
  async(query:filterListProps = {}) => {
    try {
      let urlString = 'advertisement';
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
        if (query.bot) {
          urlString += `&bot=${query.bot}`;
        }
          
      }

      const response = await Axios.get(urlString);
      return response.data
    } catch (error: any) {
      console.log("Advertisement list API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)
// ** Fetch Advertisement Detail
export const fetchAdsDetail = createAsyncThunk(
  'advertisement/fetchAdsDetail', 
  async(id: any) => {
    try {
      const response = await Axios.get(`advertisement/${id}`)
      return response.data
    } catch (error: any) {
      console.log("Advertisement detail API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)
// ** Add new advertisement
export const addNewAds = createAsyncThunk(
  'advertisement/addNewAds',
  async(data: any, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.post('advertisement',data)
      
      toast.success("Advertisement added successfully");
      dispatch(fetchAdsList())
      return response.data
    } catch (error: any) {
      console.log("Add new advertisement API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)
// ** Update specific advertisement
export const updateAds = createAsyncThunk(
  'advertisement/updateAds',
  async ({ id, data }:updateAdsInterface, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.patch(`advertisement/${id}`,data)
      
      toast.success("Advertisement updated successfully");
      // dispatch(fetchAdsDetail(id))
      dispatch(fetchAdsList())
      return response.data
    } catch (error: any) {
      console.log("Update advertisement API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)
// ** Delete advertisement
export const deleteAds = createAsyncThunk(
  'advertisement/deleteAds',
  async (id: number | string, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.delete(`advertisement/${id}`)
      
      toast.success("Advertisement deleted successfully");
      dispatch(fetchAdsList())
      return response.data
    } catch (error: any) {
      console.log("Delete advertisement API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)

export const advertisementSlice = createSlice({
  name: 'advertisement',
  initialState: {
    adsListCount: 0,
    adsListData: [],
    selectedAdsData: {},
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchAdsList.fulfilled, (state, action) => {
      state.adsListData = action.payload.data
      state.adsListCount = action.payload.count
    })
    builder.addCase(fetchAdsDetail.fulfilled, (state, action) => {
      state.selectedAdsData = action.payload
    })
  }
})

export default advertisementSlice.reducer
