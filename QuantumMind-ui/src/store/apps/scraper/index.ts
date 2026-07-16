import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Axios from 'src/helper/Axios';
import { Dispatch } from 'redux';
import { toast } from 'react-hot-toast';
interface Redux {
  getState: any;
  dispatch: Dispatch<any>;
}
export const getAllScrapData = createAsyncThunk(
  'scrape/getAllScrapUrls',
  async (data: any) => {
    let query = '';
    if(data?.skip){
      query = `skip=${data.skip}&`
    }
    if(data?.limit){
      query = `limit=${data.limit}&`
    }
    if(data?.status){
      query = `status=${data.status}&`
    }
    try {
      const response = await Axios.get(`scraper?${query}`);
      return response.data;
    } catch (error: any) {
      console.log('Scrape API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);
export const handleStartScraping = createAsyncThunk(
  'scrape/start',
  async (data: any, { dispatch }: Redux) => {
    try {
      const response = await Axios.post('/scraper', data);
      dispatch(getAllScrapData(null));
      return response.data;
    } catch (error: any) {
      console.log('Scrape API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

export const handleDeleteScrapingById = createAsyncThunk(
  'scrape/deleteScrapingById',
  async (id: any, { dispatch }: Redux) => {
    try {
      const response = await Axios.delete(`/scraper/${id}`);
      dispatch(getAllScrapData(null));
      return response.data;
    } catch (error: any) {
      console.log('Scrape API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

export const handleUpdateScrapingById = createAsyncThunk(
  'scrape/updateScrapingById',
  async (data: any, { dispatch }: Redux) => {
    try {
      const response = await Axios.put(`/scraper/${data.id}`, data);
      dispatch(getAllScrapData(null));
      return response.data;
    } catch (error: any) {
      console.log('Scrape API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

export const handleUpdateScrapeStatus = createAsyncThunk(
  'scrape/updateScrapeStatus',
  async (data: any, { dispatch }: Redux) => {
    try {
      const response = await Axios.put(`/scraper/${data.id}/status`, data);
      dispatch(getAllScrapData(null));
      return response.data;
    } catch (error: any) {
      console.log('Scrape API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

export const handleGetScrapingDataById = createAsyncThunk(
  'scrape/getScrapingById',
  async (data: any) => {
    let query = '';
    if(data?.id){
      query = `${data.id}&`
    }
    if(data?.skip){
      query = `skip=${data.skip}&`
    }
    if(data?.limit){
      query = `limit=${data.limit}&`
    }
    if(data?.status){
      query = `status=${data.status}&`
    }
    try {
      const response = await Axios.get(`/scraper/${data.id}`);
      return [response.data];
    } catch (error: any) {
      console.log('Scrape API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);
export const handleDeleteChildScrapingById = createAsyncThunk(
  'scrape/deleteScrapingById',
  async (id: any, { dispatch }: Redux) => {
    try {
      const response = await Axios.delete(`/scraper/${id}`);
      dispatch(getAllScrapData(null));
      return response.data;
    } catch (error: any) {
      console.log('Scrape API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);
export const handleUpdateChildScrapeStatus = createAsyncThunk(
  'scrape/updateScrapeStatus',
  async (data: any, { dispatch }: Redux) => {
    try {
      const response = await Axios.put(
        `/scraper/child/${data.id}/status`,
        data,
      );
      dispatch(getAllScrapData(null));
      return response.data;
    } catch (error: any) {
      console.log('Scrape API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);
export const scraperSlice = createSlice({
  name: 'scraper',
  initialState: {
    list: [],
    scrapeListById: [] as any,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getAllScrapData.fulfilled, (state, action) => {
      state.list = action.payload?.data;
    });
    builder.addCase(handleGetScrapingDataById.fulfilled, (state, action) => {
      state.scrapeListById = action.payload;
    });
  },
});

export default scraperSlice.reducer;
