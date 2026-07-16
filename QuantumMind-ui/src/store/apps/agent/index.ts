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

interface updateAgentInterface {
  id: number | string,
  data: any
}

type filterListProps = {
  skip?: number;
  limit?: number;
  status?: 'online' | 'offline' | 'busy' | 'away' | '' | string | undefined;
  tags?: string[];
  bot?: string;
}

// ** Fetch Agents list
export const fetchAgentList = createAsyncThunk(
  'agent/fetchAgentList', 
  async(query:filterListProps = {}) => {
    try {
      let urlString = 'agent';
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
        if (query.tags && Array.isArray(query.tags) && query.tags.length > 0) {
          query.tags.forEach(tag => {
            urlString += `&tags=${tag}`;
          });
        }
        if (query.bot) {
          urlString += `&bot=${query.bot}`;
        }
      }

      const response = await Axios.get(urlString);
      return response.data
    } catch (error: any) {
      console.log("Agent list API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)
// ** Fetch Agents Detail
export const fetchAgentDetail = createAsyncThunk(
  'agent/fetchAgentDetail', 
  async(id: any) => {
    try {
      const response = await Axios.get(`agent/${id}`)
      return response.data
    } catch (error: any) {
      console.log("Agent detail API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)
// ** Fetch my Agent Data
export const fetchMyAgentData = createAsyncThunk(
  'agent/fetchMyAgentData', 
  async() => {
    try {
      const response = await Axios.get('agent/me')
      return response.data
    } catch (error: any) {
      console.log("My agent details API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)
// ** Add new Agent
export const addNewAgent = createAsyncThunk(
  'agent/addNewAgent',
  async(data: any, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.post('agent',data)
      
      toast.success("New Agent added successfully");
      dispatch(fetchAgentList())
      return response.data
    } catch (error: any) {
      console.log("Add new agent API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)
// ** Update specific Agent
export const updateAgent = createAsyncThunk(
  'agent/updateAgent',
  async ({ id, data }:updateAgentInterface, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.patch(`agent/${id}`,data)
      
      toast.success("Agent updated successfully");
      dispatch(fetchAgentDetail(id))
      dispatch(fetchAgentList())
      return response.data
    } catch (error: any) {
      console.log("Update agent API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)
// ** Delete Agent
export const deleteAgent = createAsyncThunk(
  'agent/deleteAgent',
  async (id: number | string, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.delete(`agent/${id}`)
      
      toast.success("Agent deleted successfully");
      dispatch(fetchAgentList())
      return response.data
    } catch (error: any) {
      console.log("Delete agent API:Error >>>>", error);
      toast.error(error.response.data.message || error.message || error);
    }
  }
)

export const agentSlice = createSlice({
  name: 'agent',
  initialState: {
    agentListData: {
      data: [],
      count: 0,
    },
    selectedAgentData: {},
    myAgentData: {}
  },
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchAgentList.fulfilled, (state, action) => {
      state.agentListData.data = action.payload?.data
      state.agentListData.count = action.payload?.count
    })
    builder.addCase(fetchAgentDetail.fulfilled, (state, action) => {
      state.selectedAgentData = action.payload
    })
    builder.addCase(fetchMyAgentData.fulfilled, (state, action) => {
      state.myAgentData = action.payload
    })
  }
})

export default agentSlice.reducer
