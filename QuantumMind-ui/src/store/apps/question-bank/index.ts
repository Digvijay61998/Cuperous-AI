// ** Redux Imports
import { Dispatch } from 'redux';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// ** Custom Axios Imports
import Axios from 'src/helper/Axios';

// ** Toasters Imports
import { toast } from 'react-hot-toast';

interface Redux {
  getState?: any;
  dispatch: Dispatch<any>;
}

interface updateQAInterface {
  id: number | string;
  data: any;
}

type filterListProps = {
  skip?: number;
  limit?: number;
  search?: string;
  status?: 'online' | 'offline' | 'busy' | 'away' | '' | string | undefined;
  tags?: string[];
  language?: string;
};

type filterQListProps = {
  question: string;
  language?: string;
  tags?: string[];
};
// ** Fetch Question Bank list
export const fetchQuestionBankList = createAsyncThunk(
  'questionBank/fetchQuestionBankList',
  async (query: filterListProps = {}) => {
    try {
      let urlString = 'questions';
      if (query) {
        if (query.skip || query.skip === 0) {
          urlString += `?skip=${query.skip}`;
        } else {
          urlString += `?`;
        }
        if (query.limit) {
          urlString += `&limit=${query.limit}`;
        }
        if (query.search) {
          urlString += `&question=${query.search}`;
        }
        if (query.language) {
          urlString += `&language=${query.language}`;
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
      console.log('QuestionBank list API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);
// ** Fetch Question Bank Detail
export const fetchQADetail = createAsyncThunk(
  'questionBank/fetchQADetail',
  async (id: any) => {
    try {
      const response = await Axios.get(`questions/${id}`);
      return response.data;
    } catch (error: any) {
      console.log('QA detail API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);
// ** Add new Question Bank
export const addNewQA = createAsyncThunk(
  'questionBank/addNewQA',
  async (data: any, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.post('questions', data);

      toast.success('New Q&A added successfully');
      dispatch(fetchQuestionBankList());
      return response.data;
    } catch (error: any) {
      console.log('Add new QA API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);
// ** Add new Bulk Question Bank
export const addNewBulkQA = createAsyncThunk(
  'questionBank/addNewBulkQA',
  async (data: any, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.post('questions/multiple', data);

      toast.success('Bulk Q&A added successfully');
      dispatch(fetchQuestionBankList());
      return response.data;
    } catch (error: any) {
      console.log('Add new Bulk QA API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);
// ** Update specific Question Bank
export const updateQA = createAsyncThunk(
  'questionBank/updateQA',
  async ({ id, data }: updateQAInterface, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.patch(`questions/${id}`, data);

      toast.success('Q&A updated successfully');
      dispatch(fetchQADetail(id));
      dispatch(fetchQuestionBankList());
      return response.data;
    } catch (error: any) {
      console.log('Update QA API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);
// ** Change Question&Answer status to Approve or Un-Approve
export const updateQAStatus = createAsyncThunk(
  'questionBank/updateQAStatus',
  async ({ id, data }: updateQAInterface, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.post(`questions/${id}/approve`, data);

      toast.success('Q&A approved successfully');
      dispatch(fetchQADetail(id));
      dispatch(fetchQuestionBankList());
      return response.data;
    } catch (error: any) {
      console.log('Update QA status API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);
// ** Delete Question Bank
export const deleteQA = createAsyncThunk(
  'questionBank/deleteQA',
  async (id: number | string, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.delete(`questions/${id}`);

      toast.success('Q&A deleted successfully');
      dispatch(fetchQuestionBankList());
      return response.data;
    } catch (error: any) {
      console.log('Delete Q&A API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

// ** Fetch Question Bank list with searching query question
export const fetchQuestionsList = createAsyncThunk(
  'questionBank/fetchQuestionsList',
  async (
    query: filterQListProps = {
      question: '%20',
    },
  ) => {
    try {
      let urlString = 'questions/search';
      if (query) {
        if (query?.question?.trim()) {
          urlString += `?question=${query.question}`;
        } else {
          urlString += `?question=%20`;
        }
        if (query.language) {
          urlString += `&language=${query.language}`;
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
      console.log('Questions list API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

export const questionBankSlice = createSlice({
  name: 'questionBank',
  initialState: {
    questionBankListData: [],
    questionBankListCount: 0,
    selectedQAData: {},
    questionsList: [],
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchQuestionBankList.fulfilled, (state, action) => {
      state.questionBankListData = action.payload.data;
      state.questionBankListCount = action.payload.count;
    });
    builder.addCase(fetchQADetail.fulfilled, (state, action) => {
      state.selectedQAData = action.payload;
    });
    builder.addCase(fetchQuestionsList.fulfilled, (state, action) => {
      state.questionsList = action.payload;
    });
  },
});

export default questionBankSlice.reducer;
