// ** Redux Imports
import { Dispatch } from 'redux'
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Axios Imports
import Axios from 'src/helper/Axios'

// ** Toasters Imports
import { toast } from 'react-hot-toast'

interface DataParams {
  q?: string
  role?: string
  status?: string
  currentPlan?: string
}

interface Redux {
  getState: any
  dispatch: Dispatch<any>
}

// ** Fetch tag
export const gettag = createAsyncThunk('tag/gettag', async () => {
  try {
    const response = await Axios.get('tag')
    return response.data
  } catch (error: any) {
    console.log("Tag list API:Error >>>>", error);
    toast.error(error.response.data.message || error.message || error);
  }
})

// ** Fetch tag count
export const getTagCount = createAsyncThunk('tag/getTagCount', async () => {
  try {
    const response = await Axios.get('tag/count')
    return response.data
  } catch (error: any) {
    console.log("Tag count list API:Error >>>>", error);
    toast.error(error.response.data.message || error.message || error);
  }
})

  // ** Delete tag
export const deletetag = createAsyncThunk(
  'tag/deletetag',
  async (_id: number | string, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.delete(`tag/${_id}`)

      toast.success("Tag deleted successfully");
      dispatch(gettag());
      dispatch(getTagCount());
      return response.data
    } catch (error: any) {
      console.log("Tag delete API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)

// ** Add tag
export const addtag = createAsyncThunk(
  'tag/addtag',
  async (data: { [key: string]: number | string }, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.post('tag',{name:data})

      toast.success("Tag added successfully");
      dispatch(gettag());
      dispatch(getTagCount());
      return response.data
    } catch (error: any) {
      console.log("Add new tag API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)


export const tagSlice = createSlice({
  name: 'tags',
  initialState: {
    default: [],
    custom:[],
    list:[] as any[],
    countList: [] as any[],
    countDefault: [],
    countCustom:[],
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(gettag.fulfilled, (state, action) => {
      state.default = action.payload.default
      state.custom = action.payload.custom
      state.list = [...action.payload.default, ...action.payload.custom]
    })
    
    builder.addCase(getTagCount.fulfilled, (state, action) => {
      state.countDefault = action.payload.default
      state.countCustom = action.payload.custom
      state.countList = [...action.payload.default, ...action.payload.custom]
    })
  }
})

export default tagSlice.reducer
