// ** Redux Imports
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Dispatch } from 'redux';

// ** Custom Axios Imports
import Axios from 'src/helper/Axios';

// ** Toasters Imports
import { toast } from 'react-hot-toast';

interface Redux {
  dispatch: Dispatch<any>;
}

export interface ProviderOption {
  providerId: string;
  displayName: string;
  productionSafe: boolean;
}

export interface ChannelProviders {
  channel: string;
  active: string;
  providers: ProviderOption[];
}

// ** Fetch providers grouped by channel + which is active
export const fetchMessagingProviders = createAsyncThunk(
  'messaging/fetchProviders',
  async () => {
    try {
      const response = await Axios.get('messaging/providers');
      return response.data;
    } catch (error: any) {
      console.log('Messaging providers API:Error >>>>', error);
      toast.error(error.response?.data?.message || error.message || error);
    }
  },
);

// ** Switch the active provider for a channel
export const setActiveProvider = createAsyncThunk(
  'messaging/setActiveProvider',
  async (
    { channel, providerId }: { channel: string; providerId: string },
    { dispatch }: Redux,
  ) => {
    try {
      const response = await Axios.patch(
        `messaging/providers/${channel}/active`,
        { providerId },
      );
      toast.success(`Active provider updated for ${channel}`);
      dispatch(fetchMessagingProviders());
      return response.data;
    } catch (error: any) {
      console.log('Set active provider API:Error >>>>', error);
      toast.error(error.response?.data?.message || error.message || error);
    }
  },
);

export const messagingSlice = createSlice({
  name: 'messaging',
  initialState: {
    channels: [] as ChannelProviders[],
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchMessagingProviders.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchMessagingProviders.fulfilled, (state, action) => {
      state.loading = false;
      state.channels = action.payload?.channels || [];
    });
    builder.addCase(fetchMessagingProviders.rejected, (state) => {
      state.loading = false;
    });
  },
});

export default messagingSlice.reducer;
