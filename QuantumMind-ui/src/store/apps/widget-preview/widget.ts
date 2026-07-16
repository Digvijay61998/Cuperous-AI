import { Dispatch } from 'redux';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-hot-toast';
import env from 'src/configs/environments';

import axios from 'axios';
interface DataParams {
  botId: string;
}

interface Redux {
  getState: any;
  dispatch: Dispatch<any>;
}

// get node details
// ** Fetch Users
export const getBotDetails = createAsyncThunk(
  'bot/flow/node',
  async (data: object | any) => {
    try {
      const response = await axios.post(
        `${env.baseurl}/api/widget?botId=${data.botId}`,
        {...data.data}
      );
      return response.data;
    } catch (error: any) {
      console.log('error', error);
      // toast.error(error.response.data.message || error.message)
    }
  },
);

export const widgetPreview = createSlice({
  name: 'widgetPreview',
  initialState: {
    botSettings: {} as any,
    botStyles: {} as any,
    accessToken: '' as string,
    visitorId: '' as string,
    botName: '' as string,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getBotDetails.fulfilled, (state, action) => {
      state.botSettings = action.payload?.botSettings;
      state.botStyles = action.payload?.botStyles;
      state.accessToken = action.payload?.accessToken;
      state.visitorId = action.payload?.visitorId;
      state.botName = action.payload?.botName;
    });
  },
});

export default widgetPreview.reducer;
