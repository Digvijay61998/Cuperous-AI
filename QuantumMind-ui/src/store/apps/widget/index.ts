// ** Redux Imports
import { Dispatch } from 'redux';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-hot-toast';
import Axios from 'src/helper/Axios';
interface DataParams {
  botId: string;
}

interface Redux {
  getState: any;
  dispatch: Dispatch<any>;
}

// ** Fetch Bot flow
export const getBotFLow = createAsyncThunk(
  'bot/flow/get',
  async (botId: string | any) => {
    try {
      const response = await Axios.get(`/bots/${botId}/flow`);
      return response.data;
    } catch (error: any) {
      console.log('error', error);
      toast.error(error.response.data.message || error.message);
    }
  },
);

// ** Update bot flow
export const updateBotFlow = createAsyncThunk(
  'bot/update/flow',
  async (
    data: { [key: string]: number | string | any },
    { dispatch }: Redux,
  ) => {
    try {
      const response = await Axios.patch(`/bots/${data._id}/flow`, {
        edges: data.edges,
        nodes: data.nodes,
      });
      dispatch(getBotFLow(data._id));
      return response.data;
    } catch (error: any) {
      console.log('error', error);
      toast.error(error.response.data.message || error.message);
    }
  },
);

// get node details
// ** Fetch Users
export const getNodeDetails = createAsyncThunk(
  'bot/flow/node',
  async (id: string | any) => {
    try {
      const response = await Axios.get(`bots/flow/node/${id}`);
      return response.data;
    } catch (error: any) {
      console.log('error', error);
      // toast.error(error.response.data.message || error.message)
    }
  },
);

export const nodeUpdate = createAsyncThunk(
  'node/update',
  async (data: any, { dispatch }: Redux) => {
    try {
      const response = await Axios.patch(`bots/flow/node/${data.id}`, {
        ...data,
      });
      toast.success('Node data updated successfully');
      dispatch(getNodeDetails(data.id));
      return response.data;
    } catch (error: any) {
      toast.error(error.response.data.message || error.message);
    }
  },
);
export const botFlowSlice = createSlice({
  name: 'flow',
  initialState: {
    botDetails: {},
    nodeDetails: {},
    embed: {},
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getBotFLow.fulfilled, (state, action) => {
      state.botDetails = action.payload;
    });
    builder.addCase(getNodeDetails.fulfilled, (state, action) => {
      state.nodeDetails = action.payload.node;
      state.embed = action.payload.embed;
    });
  },
});

export default botFlowSlice.reducer;
