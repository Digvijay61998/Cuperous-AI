import { Dispatch } from "redux";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from "react-hot-toast";
import Axios from 'src/helper/Axios'
import { RootState } from "src/store";
import axios from "axios";
import environments from "src/configs/environments";
interface DataParams {
  botId: string;
}

interface Redux {
  getState: any;
  dispatch: Dispatch<any>;
}
const API_URL : string = environments?.api?.includes('/api') ? environments?.api : `${environments?.api}/api`
// get node details
// ** Fetch Users
export const fetchVisitor = createAsyncThunk(
  "fetch/visitor",
  async (data: any) => {
    try {
      const response = await axios.post(
        `${API_URL}/widget/visitor`,
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
  async (botId: any) => {
    try {
      const response = await Axios.post(`widget?botId=${botId}`, {
        mode: "preview",
      });
      return response.data;
    } catch (error: any) {
      console.log("error", error);
    }
  }
);

export const handleClickEvent= createAsyncThunk('event/ads-and-offer', async(data?:any, )=>{
  try {
    const response = await Axios.post(
      `widget/click`,
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

export const preview = createSlice({
  name: "preview",
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
    widgetToken: null
  },
  reducers: {
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },

    clearMessages: (state) => {
      state.messages = [];
    },
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
      state.widgetToken =action.payload?.accessToken
    });
  },
});
export const { addMessage, clearMessages } = preview.actions;

export default preview.reducer;
