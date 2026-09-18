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

interface UpdateInterface {
  id: number | string;
  data: any;
}

type FilterListProps = {
  skip?: number;
  limit?: number;
  search?: string;
  status?: string;
  stage?: string;
  owner?: string;
  sortBy?: string;
  sortOrder?: string;
};

// ** Build a query string from the filter props for a given CRM resource.
const buildQuery = (resource: string, query: FilterListProps = {}): string => {
  let urlString = `crm/${resource}`;
  const parts: string[] = [];
  if (query.skip || query.skip === 0) parts.push(`skip=${query.skip}`);
  if (query.limit) parts.push(`limit=${query.limit}`);
  if (query.search) parts.push(`text=${encodeURIComponent(query.search)}`);
  if (query.status) parts.push(`status=${query.status}`);
  if (query.stage) parts.push(`stage=${query.stage}`);
  if (query.owner) parts.push(`owner=${query.owner}`);
  if (query.sortBy) parts.push(`sortBy=${query.sortBy}`);
  if (query.sortOrder) parts.push(`sortOrder=${query.sortOrder}`);
  if (parts.length) urlString += `?${parts.join('&')}`;
  return urlString;
};

// The CRM backend is not built yet. Read thunks log errors quietly instead of
// firing a toast on every mount, so the UI simply shows its empty state until
// the endpoints exist. Write thunks keep toasts, because those are user driven.
const logQuietly = (label: string, error: any) => {
  console.log(`${label}:Error >>>>`, error?.response?.data || error?.message || error);
};

// ** Overview stats (counts + pipeline value)
export const fetchCrmStats = createAsyncThunk('crm/fetchCrmStats', async () => {
  try {
    const response = await Axios.get('crm/stats');
    return response.data;
  } catch (error: any) {
    logQuietly('CRM stats API', error);
    return undefined;
  }
});

// ** Contacts
export const fetchContacts = createAsyncThunk(
  'crm/fetchContacts',
  async (query: FilterListProps = {}) => {
    try {
      const response = await Axios.get(buildQuery('contacts', query));
      return response.data;
    } catch (error: any) {
      logQuietly('CRM contacts API', error);
      return undefined;
    }
  },
);

export const createContact = createAsyncThunk(
  'crm/createContact',
  async (data: any, { dispatch }: Redux) => {
    try {
      const response = await Axios.post('crm/contacts', data);
      toast.success('Contact created successfully');
      dispatch(fetchContacts());
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || error);
      throw error;
    }
  },
);

export const updateContact = createAsyncThunk(
  'crm/updateContact',
  async ({ id, data }: UpdateInterface, { dispatch }: Redux) => {
    try {
      const response = await Axios.patch(`crm/contacts/${id}`, data);
      toast.success('Contact updated successfully');
      dispatch(fetchContacts());
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || error);
      throw error;
    }
  },
);

export const deleteContact = createAsyncThunk(
  'crm/deleteContact',
  async (id: number | string, { dispatch }: Redux) => {
    try {
      const response = await Axios.delete(`crm/contacts/${id}`);
      toast.success('Contact deleted successfully');
      dispatch(fetchContacts());
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || error);
      throw error;
    }
  },
);

// ** Companies
export const fetchCompanies = createAsyncThunk(
  'crm/fetchCompanies',
  async (query: FilterListProps = {}) => {
    try {
      const response = await Axios.get(buildQuery('companies', query));
      return response.data;
    } catch (error: any) {
      logQuietly('CRM companies API', error);
      return undefined;
    }
  },
);

export const createCompany = createAsyncThunk(
  'crm/createCompany',
  async (data: any, { dispatch }: Redux) => {
    try {
      const response = await Axios.post('crm/companies', data);
      toast.success('Company created successfully');
      dispatch(fetchCompanies());
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || error);
      throw error;
    }
  },
);

export const deleteCompany = createAsyncThunk(
  'crm/deleteCompany',
  async (id: number | string, { dispatch }: Redux) => {
    try {
      const response = await Axios.delete(`crm/companies/${id}`);
      toast.success('Company deleted successfully');
      dispatch(fetchCompanies());
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || error);
      throw error;
    }
  },
);

// ** Deals
export const fetchDeals = createAsyncThunk(
  'crm/fetchDeals',
  async (query: FilterListProps = {}) => {
    try {
      const response = await Axios.get(buildQuery('deals', query));
      return response.data;
    } catch (error: any) {
      logQuietly('CRM deals API', error);
      return undefined;
    }
  },
);

export const createDeal = createAsyncThunk(
  'crm/createDeal',
  async (data: any, { dispatch }: Redux) => {
    try {
      const response = await Axios.post('crm/deals', data);
      toast.success('Deal created successfully');
      dispatch(fetchDeals());
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || error);
      throw error;
    }
  },
);

export const updateDealStage = createAsyncThunk(
  'crm/updateDealStage',
  async ({ id, data }: UpdateInterface, { dispatch }: Redux) => {
    try {
      const response = await Axios.patch(`crm/deals/${id}/stage`, data);
      toast.success('Deal stage updated');
      dispatch(fetchDeals());
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || error);
      throw error;
    }
  },
);

export const deleteDeal = createAsyncThunk(
  'crm/deleteDeal',
  async (id: number | string, { dispatch }: Redux) => {
    try {
      const response = await Axios.delete(`crm/deals/${id}`);
      toast.success('Deal deleted successfully');
      dispatch(fetchDeals());
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || error);
      throw error;
    }
  },
);

const emptyList = { data: [] as any[], count: 0 };

export const crmSlice = createSlice({
  name: 'crm',
  initialState: {
    stats: {
      contacts: 0,
      companies: 0,
      deals: 0,
      openDeals: 0,
      wonDeals: 0,
      pipelineValue: 0,
      currency: 'USD',
    } as Record<string, any>,
    contacts: { ...emptyList },
    companies: { ...emptyList },
    deals: { ...emptyList },
    loadingContacts: false,
    loadingCompanies: false,
    loadingDeals: false,
    loadingStats: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    // Stats
    builder.addCase(fetchCrmStats.pending, (state) => {
      state.loadingStats = true;
    });
    builder.addCase(fetchCrmStats.fulfilled, (state, action) => {
      state.loadingStats = false;
      if (action.payload) state.stats = { ...state.stats, ...action.payload };
    });
    builder.addCase(fetchCrmStats.rejected, (state) => {
      state.loadingStats = false;
    });

    // Contacts
    builder.addCase(fetchContacts.pending, (state) => {
      state.loadingContacts = true;
    });
    builder.addCase(fetchContacts.fulfilled, (state, action) => {
      state.loadingContacts = false;
      state.contacts.data = action.payload?.data || [];
      state.contacts.count = action.payload?.count || 0;
    });
    builder.addCase(fetchContacts.rejected, (state) => {
      state.loadingContacts = false;
    });

    // Companies
    builder.addCase(fetchCompanies.pending, (state) => {
      state.loadingCompanies = true;
    });
    builder.addCase(fetchCompanies.fulfilled, (state, action) => {
      state.loadingCompanies = false;
      state.companies.data = action.payload?.data || [];
      state.companies.count = action.payload?.count || 0;
    });
    builder.addCase(fetchCompanies.rejected, (state) => {
      state.loadingCompanies = false;
    });

    // Deals
    builder.addCase(fetchDeals.pending, (state) => {
      state.loadingDeals = true;
    });
    builder.addCase(fetchDeals.fulfilled, (state, action) => {
      state.loadingDeals = false;
      state.deals.data = action.payload?.data || [];
      state.deals.count = action.payload?.count || 0;
    });
    builder.addCase(fetchDeals.rejected, (state) => {
      state.loadingDeals = false;
    });
  },
});

export default crmSlice.reducer;
