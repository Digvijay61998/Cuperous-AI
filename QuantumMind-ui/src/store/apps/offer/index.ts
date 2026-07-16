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

interface updateOfferInterface {
  id: number | string,
  data: any
}

type filterListProps = {
  skip?: number;
  limit?: number;
  status?: 'published' | 'draft' | '' | string | undefined;
  bot?: string;
}

// ** Fetch Offer list
export const fetchOfferList = createAsyncThunk(
  'offer/fetchOfferList', 
  async(query:filterListProps = {}) => {
    try {
      let urlString = 'offer';
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
      console.log("Offer list API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)
// ** Fetch Offer Detail
export const fetchOfferDetail = createAsyncThunk(
  'offer/fetchOfferDetail', 
  async(id: any) => {
    try {
      const response = await Axios.get(`offer/${id}`)
      return response.data
    } catch (error: any) {
      console.log("Offer detail API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)
// ** Add new offer
export const addNewOffer = createAsyncThunk(
  'offer/addNewOffer',
  async(data: any, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.post('offer',data)
      
      toast.success("Offer added successfully");
      dispatch(fetchOfferList())
      return response.data
    } catch (error: any) {
      console.log("Add new offer API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)
// ** Update specific offer
export const updateOffer = createAsyncThunk(
  'offer/updateOffer',
  async ({ id, data }:updateOfferInterface, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.patch(`offer/${id}`,data)
      
      toast.success("Offer updated successfully");
      // dispatch(fetchOfferDetail(id))
      dispatch(fetchOfferList())
      return response.data
    } catch (error: any) {
      console.log("Update offer API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)
// ** Delete offer
export const deleteOffer = createAsyncThunk(
  'offer/deleteOffer',
  async (id: number | string, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.delete(`offer/${id}`)
      
      toast.success("Offer deleted successfully");
      dispatch(fetchOfferList())
      return response.data
    } catch (error: any) {
      console.log("Delete offer API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)

export const offerSlice = createSlice({
  name: 'offer',
  initialState: {
    offerListCount: 0,
    offerListData: [],
    selectedOfferData: {},
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchOfferList.fulfilled, (state, action) => {
      state.offerListData = action.payload.data
      state.offerListCount = action.payload.count
    })
    builder.addCase(fetchOfferDetail.fulfilled, (state, action) => {
      state.selectedOfferData = action.payload
    })
  }
})

export default offerSlice.reducer
