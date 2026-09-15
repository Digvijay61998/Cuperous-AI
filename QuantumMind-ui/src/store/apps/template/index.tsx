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

interface UpdateTemplateInterface {
  id: number | string;
  data: any;
}

interface VersionUploadInterface {
  id: string;
  data: FormData;
}

type FilterListProps = {
  skip?: number;
  limit?: number;
  search?: string;
  status?: string;
  industry?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: string;
};

// ** Build a query string from the filter props
const buildQuery = (query: FilterListProps = {}): string => {
  let urlString = 'template';
  const parts: string[] = [];
  if (query.skip || query.skip === 0) parts.push(`skip=${query.skip}`);
  if (query.limit) parts.push(`limit=${query.limit}`);
  if (query.search) parts.push(`text=${encodeURIComponent(query.search)}`);
  if (query.status) parts.push(`status=${query.status}`);
  if (query.industry) parts.push(`industry=${query.industry}`);
  if (query.category) parts.push(`category=${query.category}`);
  if (query.sortBy) parts.push(`sortBy=${query.sortBy}`);
  if (query.sortOrder) parts.push(`sortOrder=${query.sortOrder}`);
  if (parts.length) urlString += `?${parts.join('&')}`;
  return urlString;
};

// ** Fetch templates
export const fetchTemplates = createAsyncThunk(
  'template/fetchTemplates',
  async (query: FilterListProps = {}) => {
    try {
      const response = await Axios.get(buildQuery(query));
      return response.data;
    } catch (error: any) {
      console.log('Template list API:Error >>>>', error);
      toast.error(error.response?.data?.message || error.message || error);
    }
  },
);

// ** Fetch filter params (industries, categories, statuses)
export const fetchTemplateParams = createAsyncThunk(
  'template/fetchTemplateParams',
  async () => {
    try {
      const response = await Axios.get('template/params');
      return response.data;
    } catch (error: any) {
      console.log('Template params API:Error >>>>', error);
      toast.error(error.response?.data?.message || error.message || error);
    }
  },
);

// ** Fetch single template detail
export const fetchTemplateDetail = createAsyncThunk(
  'template/fetchTemplateDetail',
  async (id: any) => {
    try {
      const response = await Axios.get(`template/${id}`);
      return response.data;
    } catch (error: any) {
      console.log('Template detail API:Error >>>>', error);
      toast.error(error.response?.data?.message || error.message || error);
    }
  },
);

// ** Upload a new template (multipart/form-data)
export const uploadTemplate = createAsyncThunk(
  'template/uploadTemplate',
  async (data: FormData, { dispatch }: Redux) => {
    try {
      const response = await Axios.post('template', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Template uploaded successfully');
      dispatch(fetchTemplates());
      return response.data;
    } catch (error: any) {
      console.log('Upload template API:Error >>>>', error);
      toast.error(error.response?.data?.message || error.message || error);
      throw error;
    }
  },
);

// ** Update template metadata
export const updateTemplate = createAsyncThunk(
  'template/updateTemplate',
  async ({ id, data }: UpdateTemplateInterface, { dispatch }: Redux) => {
    try {
      const response = await Axios.patch(`template/${id}`, data);
      toast.success('Template updated successfully');
      dispatch(fetchTemplateDetail(id));
      dispatch(fetchTemplates());
      return response.data;
    } catch (error: any) {
      console.log('Update template API:Error >>>>', error);
      toast.error(error.response?.data?.message || error.message || error);
    }
  },
);

// ** Upload a new version of an existing template
export const uploadTemplateVersion = createAsyncThunk(
  'template/uploadTemplateVersion',
  async ({ id, data }: VersionUploadInterface, { dispatch }: Redux) => {
    try {
      const response = await Axios.post(`template/${id}/version`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('New version uploaded successfully');
      dispatch(fetchTemplates());
      return response.data;
    } catch (error: any) {
      console.log('Upload version API:Error >>>>', error);
      toast.error(error.response?.data?.message || error.message || error);
      throw error;
    }
  },
);

// ** Update template config values (labels/images/colors)
export const updateTemplateConfig = createAsyncThunk(
  'template/updateTemplateConfig',
  async ({ id, data }: UpdateTemplateInterface, { dispatch }: Redux) => {
    try {
      const response = await Axios.patch(`template/${id}/config`, data);
      toast.success('Template configuration saved');
      dispatch(fetchTemplateDetail(id));
      return response.data;
    } catch (error: any) {
      console.log('Update config API:Error >>>>', error);
      toast.error(error.response?.data?.message || error.message || error);
    }
  },
);

// ** Resolve a template's config for a specific bot.
// Returns manifest defaults <- catalog values <- this bot's overrides, merged
// server-side, so the editor shows what the customer will actually see.
export const fetchTemplateConfig = createAsyncThunk(
  'template/fetchTemplateConfig',
  async ({ id, botId }: { id: string; botId?: string }) => {
    const response = await Axios.get(`template/${id}/config`, {
      params: botId ? { bid: botId } : undefined,
    });

    return response.data;
  },
);

// ** Save config overrides for ONE bot.
// Deliberately separate from updateTemplateConfig: that one edits the shared
// catalog defaults for every bot using the template, which is not what you want
// when tailoring a template to a single bot.
export const updateTemplateInstanceConfig = createAsyncThunk(
  'template/updateTemplateInstanceConfig',
  async ({
    id,
    botId,
    configValues,
  }: {
    id: string;
    botId: string;
    configValues: Record<string, any>;
  }) => {
    try {
      const response = await Axios.patch(`template/${id}/instance-config`, {
        botId,
        configValues,
      });
      toast.success('Template settings saved for this bot');

      return response.data;
    } catch (error: any) {
      console.log('Update instance config API:Error >>>>', error);
      toast.error(error.response?.data?.message || error.message || error);
      throw error;
    }
  },
);

// ** Publish / Unpublish / Archive
export const publishTemplate = createAsyncThunk(
  'template/publishTemplate',
  async (id: string, { dispatch }: Redux) => {
    try {
      const response = await Axios.post(`template/${id}/publish`);
      toast.success('Template published');
      dispatch(fetchTemplates());
      return response.data;
    } catch (error: any) {
      console.log('Publish template API:Error >>>>', error);
      toast.error(error.response?.data?.message || error.message || error);
    }
  },
);

export const unpublishTemplate = createAsyncThunk(
  'template/unpublishTemplate',
  async (id: string, { dispatch }: Redux) => {
    try {
      const response = await Axios.post(`template/${id}/unpublish`);
      toast.success('Template moved to draft');
      dispatch(fetchTemplates());
      return response.data;
    } catch (error: any) {
      console.log('Unpublish template API:Error >>>>', error);
      toast.error(error.response?.data?.message || error.message || error);
    }
  },
);

export const archiveTemplate = createAsyncThunk(
  'template/archiveTemplate',
  async (id: string, { dispatch }: Redux) => {
    try {
      const response = await Axios.post(`template/${id}/archive`);
      toast.success('Template archived');
      dispatch(fetchTemplates());
      return response.data;
    } catch (error: any) {
      console.log('Archive template API:Error >>>>', error);
      toast.error(error.response?.data?.message || error.message || error);
    }
  },
);

// ** Duplicate template
export const duplicateTemplate = createAsyncThunk(
  'template/duplicateTemplate',
  async (id: string, { dispatch }: Redux) => {
    try {
      const response = await Axios.post(`template/${id}/duplicate`);
      toast.success('Template duplicated');
      dispatch(fetchTemplates());
      return response.data;
    } catch (error: any) {
      console.log('Duplicate template API:Error >>>>', error);
      toast.error(error.response?.data?.message || error.message || error);
    }
  },
);

// ** Delete template (soft delete)
export const deleteTemplate = createAsyncThunk(
  'template/deleteTemplate',
  async (id: number | string, { dispatch }: Redux) => {
    try {
      const response = await Axios.delete(`template/${id}`);
      toast.success('Template deleted successfully');
      dispatch(fetchTemplates());
      return response.data;
    } catch (error: any) {
      console.log('Delete template API:Error >>>>', error);
      toast.error(error.response?.data?.message || error.message || error);
    }
  },
);

export const templateSlice = createSlice({
  name: 'template',
  initialState: {
    templateListData: {
      data: [] as any[],
      count: 0,
    },
    templateParams: {
      industries: [] as string[],
      categories: [] as string[],
      statuses: [] as string[],
    },
    selectedTemplateDetail: {} as any,
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchTemplates.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchTemplates.fulfilled, (state, action) => {
      state.loading = false;
      state.templateListData.data = action.payload?.data || [];
      state.templateListData.count = action.payload?.count || 0;
      if (action.payload?.params) {
        state.templateParams = action.payload.params;
      }
    });
    builder.addCase(fetchTemplates.rejected, (state) => {
      state.loading = false;
    });
    builder.addCase(fetchTemplateParams.fulfilled, (state, action) => {
      if (action.payload) state.templateParams = action.payload;
    });
    builder.addCase(fetchTemplateDetail.fulfilled, (state, action) => {
      state.selectedTemplateDetail = action.payload || {};
    });
  },
});

export default templateSlice.reducer;
