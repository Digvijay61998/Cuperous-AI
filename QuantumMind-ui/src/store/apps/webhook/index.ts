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

interface updateWebhookInterface {
  id: number | string,
  data: any
}

// ** Fetch Webhook list
export const fetchWebhookList = createAsyncThunk(
  'webhook/fetchWebhookList', 
  async() => {
    try {
      const response = await Axios.get('webhook')
      return response.data
    } catch (error:any) {
      console.log("Webhook list API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)
// ** Fetch specific Webhook Detail
export const fetchWebhookDetail = createAsyncThunk(
  'webhook/fetchWebhookDetail', 
  async(id: any) => {
    try {
      const response = await Axios.get(`webhook/${id}`)
      return response.data
    } catch (error:any) {
      console.log("Webhook details API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)
// ** Add new Webhook
export const addNewWebhook = createAsyncThunk(
  'webhook/addNewWebhook',
  async(data: any, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.post('webhook',data);

      toast.success("New Webhook added successfully");
      dispatch(fetchWebhookList())
      return response.data
    } catch (error:any) {
      console.log("Add new Webhook API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)
// ** Update specific Webhook
export const updateWebhook = createAsyncThunk(
  'webhook/updateWebhook',
  async ({ id, data }:updateWebhookInterface, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.patch(`webhook/${id}`,data);
      
      toast.success("Webhook updated successfully");
      dispatch(fetchWebhookDetail(id))
      dispatch(fetchWebhookList())
      return response.data
    } catch (error:any) {
      console.log("Update Webhook API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)
// ** Delete Webhook 
export const deleteWebhook = createAsyncThunk(
  'webhook/deleteWebhook',
  async (id: number | string, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.delete(`webhook/${id}`);
      
      toast.success("Webhook deleted successfully");
      dispatch(fetchWebhookList())
      return response.data
    } catch (error: any) {
      console.log("Delete Webhook API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)
// ** Test Webhook
export const testWebhook = createAsyncThunk(
  'webhook/testWebhook',
  async(id: any, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.get(`webhook/test/${id}`)
      
      toast.success("Webhook working successfully");
      dispatch(fetchWebhookList())
      return response.data
    } catch (error:any) {
      console.log("Test Webhook API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)

export const WebhookSlice = createSlice({
  name: 'webhook',
  initialState: {
    webhookListData: {
      data: [],
      count: 0,
    },
    selectedWebhookData: {},
    testedResult: null
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchWebhookList.fulfilled, (state, action) => {
      state.webhookListData.data = action.payload?.data
      state.webhookListData.count = action.payload?.count
    })
    builder.addCase(fetchWebhookDetail.fulfilled, (state, action) => {
      state.selectedWebhookData = action.payload
    })
    builder.addCase(testWebhook.fulfilled, (state, action) => {
      state.testedResult = action.payload
    })
  }
})

export default WebhookSlice.reducer
