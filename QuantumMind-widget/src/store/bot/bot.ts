import { Dispatch } from "redux";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-hot-toast";
import axios from "axios";
import { RootState } from "..";
interface DataParams {
  botId: string;
}

interface Redux {
  getState: any;
  dispatch: Dispatch<any>;
}

// get node details
// ** Fetch Users
export const fetchVisitor = createAsyncThunk(
  "fetch/visitor",
  async (data: any) => {
    try {
      const response = await axios.post(
        `${window.baseUrl}/api/widget/visitor`,
        {
          ...data.data,
        },{
          headers:{
            Authorization: `Bearer ${data.token}`
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.log("error", error);
    }
  }
);

export const getBotMetadata = createAsyncThunk(
  "bot/details",
  async (botId: string) => {
    try {
      const response = await axios.post(`${window.baseUrl}/api/widget?botId=${botId}`, {
        mode: "live",
      });
      return response.data;
    } catch (error: any) {
      console.log("error", error);
    }
  }
);

export const handleClickEvent= createAsyncThunk('event/ads-and-offer', async(data?:any, )=>{
  try {
    console.log({data})
    const response = await axios.post(
      `${window.baseUrl}/api/widget/click`,
      {
        ...data.data,
      },{
        headers:{
          Authorization: `Bearer ${data.token}`
        }
      }
    );
    return response.data;
  } catch (error: any) {
    console.log("error", error);
  }
})



export const translateLanguage = createAsyncThunk(
  "translate",
  async (data: any) => {
    try {
      const res = await axios.post(
        `https://www.google.com/inputtools/request?text=${data.text}&itc=${data.lang}-t-i0-und&num=13&cp=0&cs=1&ie=utf-8&oe=utf-8&app=demopage`
      );
      return res.data;
    } catch (error: any) {
      console.log("TRANSLATE API AXIOS ERROR >>> ", error);
    }
  }
);

export const bot = createSlice({
  name: "bot",
  initialState: {
    botSettings: {} as any,
    botStyles: {} as any,
    accessToken: "" as any,
    visitorId: "" as any,
    botName: "" as any,
    headerDetails: {} as any,
    messages: [] as any,
    adsArr: [] as any,
    offersArr: [] as any,
    languages: [] as any,
    widgetToken: null,
    isSoundOn: true,
    isLocation: false as any
  },
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },

    clearMessages: (state) => {
      state.messages = [];
    },
    toggleSound: (state, action) => {
      state.isSoundOn = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchVisitor.fulfilled, (state, action) => {
      state.accessToken = action.payload?.accessToken;
      state.visitorId = action.payload?.visitorId;
    });
    builder.addCase(getBotMetadata.fulfilled, (state, action) => {
      state.botSettings = action.payload?.botSettings;
      state.botStyles = action.payload?.botStyles;
      state.botName = action.payload?.botName;
      state.adsArr = action.payload?.advertisement;
      state.offersArr = action.payload?.offer;
      state.languages = action.payload?.botSettings?.languages;
      state.widgetToken =action.payload?.accessToken;
      state.isLocation = action.payload?.botSettings?.isLocation;
    });
  },
});
export const { addMessage, clearMessages, toggleSound } = bot.actions;

export default bot.reducer;
