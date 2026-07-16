import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Axios from 'src/helper/Axios';

export const getBotCardStats = createAsyncThunk('bots/states', async () => {
  try {
    const response = await Axios.get(`/bots/stats`);
    return response.data;
  } catch (error: any) {
    console.log('Bot states API:Error >>>>', error);
  }
});

export const getAgentsCardStats = createAsyncThunk('agent/states', async () => {
  try {
    const response = await Axios.get(`/agent/stats`);
    return response.data;
  } catch (error: any) {
    console.log('Agent stats API:Error >>>>', error);
  }
});

export const getQuestionCardStates = createAsyncThunk(
  'question/states',
  async () => {
    try {
      const response = await Axios.get(`questions/report/stats`);
      return response.data;
    } catch (error: any) {
      console.log('QuestionBank stats API:Error >>>>', error);
    }
  },
);

export const getVisitorCardStates = createAsyncThunk(
  'visitor/states',
  async () => {
    try {
      const response = await Axios.get(`visitor/stats`);
      return response.data;
    } catch (error: any) {
      console.log('Visitor stats API:Error >>>>', error);
    }
  },
);

export const getTicketCardStates = createAsyncThunk(
  'tickets/states',
  async () => {
    try {
      const response = await Axios.get(`tickets/stats`);
      return response.data;
    } catch (error: any) {
      console.log('Tickets stats API:Error >>>>', error);
    }
  },
);

export const getWebhookCardStates = createAsyncThunk(
  'webhook/states',
  async () => {
    try {
      const response = await Axios.get(`webhook/stats`);
      return response.data;
    } catch (error: any) {
      console.log('Webhook stats API:Error >>>>', error);
    }
  },
);

export const getSegmentsCardStates = createAsyncThunk(
  'segment/states',
  async () => {
    try {
      const response = await Axios.get(`segments/stats`);
      return response.data;
    } catch (error: any) {
      console.log('Segment stats API:Error >>>>', error);
    }
  },
);

export const getTagsCardStats = createAsyncThunk('tag/states', async () => {
  try {
    const response = await Axios.get(`tag/stats`);
    return response.data;
  } catch (error: any) {
    console.log('Tag stats API:Error >>>>', error);
  }
});

export const getAdvertisementCardStats = createAsyncThunk(
  'advertisement/states',
  async () => {
    try {
      const response = await Axios.get(`advertisement/stats`);
      return response.data;
    } catch (error: any) {
      console.log('Advertisement stats API:Error >>>>', error);
    }
  },
);

export const getOffersCardStats = createAsyncThunk('offer/states', async () => {
  try {
    const response = await Axios.get(`offer/stats`);
    return response.data;
  } catch (error: any) {
    console.log('Offer stats API:Error >>>>', error);
  }
});

export const getSocialsCardStats = createAsyncThunk('social/states', async () => {
  try {
    const response = await Axios.get(`social/stats`);
    return response.data;
  } catch (error: any) {
    console.log('Social stats API:Error >>>>', error);
  }
});

export const getActiveConversationStats = createAsyncThunk(
  'activeConversation/states',
  async () => {
    try {
      const response = await Axios.get(`conversation/stats/active`);
      return response.data;
    } catch (error: any) {
      console.log('ActiveConversation stats API:Error >>>>', error);
    }
  },
);

export const getHistoryConversationStats = createAsyncThunk(
  'historyConversation/states',
  async () => {
    try {
      const response = await Axios.get(`conversation/stats/history`);
      return response.data;
    } catch (error: any) {
      console.log('HistoryConversation stats API:Error >>>>', error);
    }
  },
);

export const getBlockedConversationStats = createAsyncThunk(
  'blockedConversation/states',
  async () => {
    try {
      const response = await Axios.get(`conversation/stats/block`);
      return response.data;
    } catch (error: any) {
      console.log('BlockedConversation stats API:Error >>>>', error);
    }
  },
);

export const statesSlice = createSlice({
  name: 'states',
  initialState: {
    botStates: [],
    agentStates: [],
    questionStates: [] as any,
    visitorStates: [] as any,
    ticketStates: [] as any,
    webhookStates: [] as any,
    segmentStates: [] as any,
    tagsStats: [] as any,
    advertisementStats: [] as any,
    offerStats: [] as any,
    socialStats: [] as any,
    activeStats: [] as any,
    history: [] as any,
    blocked: [] as any,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getBotCardStats.fulfilled, (state, action) => {
      state.botStates = action.payload;
    });
    builder.addCase(getAgentsCardStats.fulfilled, (state, action) => {
      state.agentStates = action.payload;
    });
    builder.addCase(getQuestionCardStates.fulfilled, (state, action) => {
      state.questionStates = action.payload;
    });

    builder.addCase(getVisitorCardStates.fulfilled, (state, action) => {
      state.visitorStates = action.payload;
    });
    builder.addCase(getTicketCardStates.fulfilled, (state, action) => {
      state.ticketStates = action.payload;
    });

    builder.addCase(getWebhookCardStates.fulfilled, (state, action) => {
      state.webhookStates = action.payload;
    });
    builder.addCase(getSegmentsCardStates.fulfilled, (state, action) => {
      state.segmentStates = action.payload;
    });

    builder.addCase(getTagsCardStats.fulfilled, (state, action) => {
      state.tagsStats = action.payload;
    });
    builder.addCase(getAdvertisementCardStats.fulfilled, (state, action) => {
      state.advertisementStats = action.payload;
    });
    builder.addCase(getOffersCardStats.fulfilled, (state, action) => {
      state.offerStats = action.payload;
    });
    builder.addCase(getSocialsCardStats.fulfilled, (state, action) => {
      state.socialStats = action.payload;
    });
    builder.addCase(getActiveConversationStats.fulfilled, (state, action) => {
      state.activeStats = action.payload;
    });
    builder.addCase(getHistoryConversationStats.fulfilled, (state, action) => {
      state.history = action.payload;
    });
    builder.addCase(getBlockedConversationStats.fulfilled, (state, action) => {
      state.blocked = action.payload;
    });
  },
});

export default statesSlice.reducer;
