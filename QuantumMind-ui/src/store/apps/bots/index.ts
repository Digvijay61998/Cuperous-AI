// ** Redux Imports
import { Dispatch } from 'redux';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// ** Axios Imports
import Axios from 'src/helper/Axios';

// ** Toasters Imports
import { toast } from 'react-hot-toast';

interface DataParams {
  q: string;
  role: string;
  status: string;
  currentPlan: string;
}

interface Redux {
  getState: any;
  dispatch: Dispatch<any>;
}

type filterListProps = {
  skip?: number;
  limit?: number;
  status?: 'active' | 'suspended' | 'deleted' | '' | string | undefined;
  tags?: string[];
};

type filterDownloadProps = {
  botId?: any;
};

// ** Fetch Bots
// export const fetchBotData = createAsyncThunk('bots/fetchBotData', async (params: DataParams) => {
//   const response = await Axios.get('bots')
//   return response.data
// })

export const fetchBotData = createAsyncThunk(
  'bots/fetchBotData',
  async (query: filterListProps = {}) => {
    try {
      let urlString = 'bots';
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
          query.tags.forEach((tag) => {
            urlString += `&tags=${tag}`;
          });
        }
      }

      const response = await Axios.get(urlString);
      return response.data;
    } catch (error: any) {
      console.log('Bot list API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

// ** Fetch Bots
export const fetchBotByID = createAsyncThunk(
  'bots/fetchBotByID',
  async (_id: string) => {
    try {
      const response = await Axios.get(`bots/${_id}`);
      return response.data;
    } catch (error: any) {
      console.log('Bot detail API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);
// ** Fetch Bots
export const fetchBotByIDSetting = createAsyncThunk(
  'bots/fetchBotByIDSetting',
  async (_id: number | string) => {
    try {
      const response = await Axios.get(`bots/${_id}/setting`);
      return response.data;
    } catch (error: any) {
      console.log('Bot setting detail API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);
// ** Fetch Bots
export const fetchBotByIDStyle = createAsyncThunk(
  'bots/fetchBotByIDStyle',
  async (_id: number | string) => {
    try {
      const response = await Axios.get(`bots/${_id}/style`);
      return response.data;
    } catch (error: any) {
      console.log('Bot style detail API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

export const fetchExportBots = createAsyncThunk(
  'bots/exportBots',
  async (data: any) => {
    try {
      const response = await Axios.post(
        `bots/export`,
        {
          botIds: data,
        },
        {
          responseType: 'blob',
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');

      link.href = url;
      link.setAttribute('download', 'bots.json');
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('successfully exported...!');
    } catch (error: any) {
      console.log('Bot export API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

export const fetchImportBots = createAsyncThunk(
  'bots/fetchImportBots',
  async (formData: any) => {
    try {
      const response = await Axios.post(`bots/import`, formData);
      toast.success('successfully imported...!');
    } catch (error: any) {
      console.log('Bot import API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

export const uploadFilesForBot = createAsyncThunk(
  'bots/uploadFiles',
  async (formData: any) => {
    try {
      const response = await Axios.post(`bots/uploadFiles`, formData);
      toast.success('successfully imported...!');
    } catch (error: any) {
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

// ** Delete Bots
export const deleteBot = createAsyncThunk(
  'bots/deleteBot',
  async (_id: number | string, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.delete(`bots/${_id}`);

      toast.success('Bot deleted successfully');
      dispatch(fetchBotData(getState().user.params));

      return response.data;
    } catch (error: any) {
      console.log('Delete bot API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

//for create
type botDataType = {
  name: string;
  tags: any;
  agents: any;
  primaryColor: string;
  botType : string;
};

//for bot Setting
type botDataSettingType = {
  botId: string | any;
  domains: any;
  welcomeMessages: string;
  blockedContent: any;
  blockedCountries: any;
  askForFeedback: boolean;
  getVisitorInfo: boolean;
  typingIndicator: boolean;
  storeVisitorInfoInCookies: boolean;
  fallbackMessage: string;
};

//for bot Style
type botDataStyleType = {
  botId: string | any;
  textColor: string;
  primaryColor: string;
  secondaryColor: string;
  avatar: string;
  headerTextColor: string;
  headerBackgroundColor: string;
  buttonColor: string;
  buttonTextColor: string;
};

//for bot General Setting
type botDataGeneralType = {
  _id: string | any;
  name: string;
  tags: any;
  agents: any;
  primaryColor: string;
};

// Create Bot
export const CreateBotData = createAsyncThunk(
  'bots/createBot',
  async (data: botDataType, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.post('bots', { ...data });

      toast.success('Bot created successfully');
      //dispatch(fetchBotData(getState().user.params))
      localStorage.setItem('botID', response.data?._id);

      return response.data;
    } catch (error: any) {
      console.log('Create bot API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

// patch Bot General
export const UpdateBotGeneral = createAsyncThunk(
  'bots/updateBotGeneral',
  async (data: botDataGeneralType, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.patch(`bots/${data._id}`, { ...data });

      toast.success('Bot general updated successfully');
      return response.data;
    } catch (error: any) {
      console.log('Update bot general API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

// patch Bot Setting
export const UpdateBotSettingData = createAsyncThunk(
  'bots/updateBotSetting',
  async (data: botDataSettingType, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.patch(`bots/${data.botId}/setting`, {
        ...data,
      });

      toast.success('Bot setting updated successfully');
      dispatch(getBotDataById(data.botId));
      return response.data;
    } catch (error: any) {
      console.log('Update bot setting API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

// patch Bot Style
export const UpdateBotStyleData = createAsyncThunk(
  'bots/updateBotStyle',
  async (data: botDataStyleType, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.patch(`bots/${data.botId}/style`, {
        ...data,
      });

      toast.success('Bot style updated successfully');
      return response.data;
    } catch (error: any) {
      console.log('Update bot style API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

// ** Fetch Bot Details By Bot ID
export const getBotDataById = createAsyncThunk(
  'bots/botsDetailsById',
  async (botId: string | any) => {
    try {
      const response = await Axios.get(`/bots/${botId}/`);
      return response.data;
    } catch (error: any) {
      console.log('Bot detail API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

// ** fetch unanswered questions
export const getUnansweredQuestions = createAsyncThunk(
  'bots/botsUAQuestionsById',
  async (botId: string | any) => {
    try {
      const response = await Axios.get(`/unanswered/${botId}/`);
      return response.data;
    } catch (error: any) {
      console.log('Bot unanswered question API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

// ** delete unanswered questions
export const deleteUnansweredQuestions = createAsyncThunk(
  'bots/deleteUAQuestionById',
  async (
    { botId, questionId, showToast }: any,
    { getState, dispatch }: Redux,
  ) => {
    try {
      const response = await Axios.delete(`/unanswered/${questionId}/`);

      if (showToast) {
        toast.success('Unanswered question removed');
      }
      dispatch(getUnansweredQuestions(botId));
      return response.data;
    } catch (error: any) {
      console.log('Remove unanswered question API:Error >>>>', error);
      if (showToast) {
        toast.error(error.response.data.message || error.message || error);
      }
    }
  },
);

// ** fetch all unanswered questions csv data or specific with botId
export const downloadUnansweredQuestions = createAsyncThunk(
  'bots/downloadUnansweredQuestionsOrById',
  async (query: filterDownloadProps = {}) => {
    try {
      let urlString = '/unanswered/download';
      if (query) {
        if (query.botId) {
          urlString += `?botId=${query.botId}`;
        } else {
          urlString += `?`;
        }
      }

      const response = await Axios.get(urlString);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(
        new Blob([response?.data], { type: 'application/csv' }),
      );
      a.download = `unansweredQuestion${query?.botId || ''}.csv`;
      a.click();
      return response.data;
    } catch (error: any) {
      console.log('Download unanswered question API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

// ** fetch languages that support **
export const fetchLanguages = createAsyncThunk(
  'bots/fetchLanguages',
  async () => {
    try {
      const response = await Axios.get(`/bots/languages`);
      return response.data;
    } catch (error: any) {
      console.log('Fetch languages API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

export const botsSlice = createSlice({
  name: 'bots',
  initialState: {
    list: [],
    botSettingData: {},
    botUnansweredQuestions: {},
    publishedBots: [], // bot published and status active
    languages: [],
    isLoadingExportBot: false,
    isLoadingImportBot: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchBotData.fulfilled, (state, action) => {
      state.list = action.payload;
      state.publishedBots = action.payload.reduce((arr: any, obj: any) => {
        if (obj.published === true && obj.status === 'active') {
          return [...arr, obj];
        }
        return arr;
      }, []);
    });
    builder.addCase(getBotDataById.fulfilled, (state, action) => {
      state.botSettingData = action.payload;
    });
    builder.addCase(getUnansweredQuestions.fulfilled, (state, action) => {
      state.botUnansweredQuestions = action.payload;
    });
    builder.addCase(fetchLanguages.fulfilled, (state, action) => {
      state.languages = action.payload;
    });
    builder.addCase(fetchExportBots.pending, (state) => {
      state.isLoadingExportBot = true;
    });
    builder.addCase(fetchExportBots.fulfilled, (state) => {
      state.isLoadingExportBot = false;
    });
    builder.addCase(fetchExportBots.rejected, (state) => {
      state.isLoadingExportBot = false;
    });
    builder.addCase(fetchImportBots.pending, (state) => {
      state.isLoadingImportBot = true;
    });
    builder.addCase(fetchImportBots.fulfilled, (state) => {
      state.isLoadingImportBot = false;
    });
    builder.addCase(fetchImportBots.rejected, (state) => {
      state.isLoadingImportBot = false;
    });
  },
});

export default botsSlice.reducer;
