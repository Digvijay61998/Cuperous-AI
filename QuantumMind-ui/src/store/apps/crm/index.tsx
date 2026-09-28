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
  page?: number;
  pageSize?: number;
  q?: string;
  stage?: string;
  owner?: string;
  company?: string;
  source?: string;
  sort?: string;
  dir?: 'asc' | 'desc';
};

// ** Build a query string from the filter props for a given CRM resource.
// Matches the backend contract (crm/* controllers): page (1-based), pageSize, q.
const buildQuery = (resource: string, query: FilterListProps = {}): string => {
  let urlString = `crm/${resource}`;
  const parts: string[] = [];
  if (query.page) parts.push(`page=${query.page}`);
  if (query.pageSize) parts.push(`pageSize=${query.pageSize}`);
  if (query.q) parts.push(`q=${encodeURIComponent(query.q)}`);
  if (query.stage) parts.push(`stage=${query.stage}`);
  if (query.owner) parts.push(`owner=${query.owner}`);
  if (query.company) parts.push(`company=${query.company}`);
  if (query.source) parts.push(`source=${query.source}`);
  if (query.sort) parts.push(`sort=${query.sort}`);
  if (query.dir) parts.push(`dir=${query.dir}`);
  if (parts.length) urlString += `?${parts.join('&')}`;
  return urlString;
};

// Read thunks log errors quietly instead of firing a toast on every mount, so a
// transient backend hiccup shows the empty state rather than a red banner. Write
// thunks keep toasts, because those are user driven.
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

// ** Intelligence: queue enrichment + accept/dismiss evidence-scored suggestions
export const enrichContact = createAsyncThunk(
  'crm/enrichContact',
  async (id: string, { dispatch }: Redux) => {
    try {
      const response = await Axios.post(`crm/contacts/${id}/enrich`);
      toast.success('Enrichment queued');
      dispatch(fetchContactById(id));
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || error);
      throw error;
    }
  },
);

export const decideFact = createAsyncThunk(
  'crm/decideFact',
  async (
    { factId, decision, contactId }: { factId: string; decision: 'accept' | 'dismiss'; contactId: string },
    { dispatch }: Redux,
  ) => {
    try {
      const response = await Axios.post(`crm/facts/${factId}/decide`, { decision });
      toast.success(decision === 'accept' ? 'Suggestion applied' : 'Suggestion dismissed');
      dispatch(fetchContactById(contactId));
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

export const updateCompany = createAsyncThunk(
  'crm/updateCompany',
  async ({ id, data }: UpdateInterface, { dispatch }: Redux) => {
    try {
      const response = await Axios.patch(`crm/companies/${id}`, data);
      toast.success('Company updated successfully');
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

export const updateDeal = createAsyncThunk(
  'crm/updateDeal',
  async ({ id, data }: UpdateInterface, { dispatch }: Redux) => {
    try {
      const response = await Axios.patch(`crm/deals/${id}`, data);
      toast.success('Deal updated successfully');
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

// ** Record detail (byId)
export const fetchContactById = createAsyncThunk(
  'crm/fetchContactById',
  async (id: string) => {
    const response = await Axios.get(`crm/contacts/${id}`);
    return response.data;
  },
);

export const fetchCompanyById = createAsyncThunk(
  'crm/fetchCompanyById',
  async (id: string) => {
    const response = await Axios.get(`crm/companies/${id}`);
    return response.data;
  },
);

export const fetchDealById = createAsyncThunk('crm/fetchDealById', async (id: string) => {
  const response = await Axios.get(`crm/deals/${id}`);
  return response.data;
});

// ** Activities (timeline)
type ActivityScope = { contactId?: string; companyId?: string; dealId?: string };

export const fetchActivities = createAsyncThunk(
  'crm/fetchActivities',
  async (scope: ActivityScope) => {
    const parts: string[] = [];
    if (scope.contactId) parts.push(`contactId=${scope.contactId}`);
    if (scope.companyId) parts.push(`companyId=${scope.companyId}`);
    if (scope.dealId) parts.push(`dealId=${scope.dealId}`);
    const qs = parts.length ? `?${parts.join('&')}` : '';
    const response = await Axios.get(`crm/activities${qs}`);
    return response.data;
  },
);

export const createActivity = createAsyncThunk(
  'crm/createActivity',
  async (data: any) => {
    try {
      const response = await Axios.post('crm/activities', data);
      toast.success('Activity added');
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || error);
      throw error;
    }
  },
);

export const deleteActivity = createAsyncThunk(
  'crm/deleteActivity',
  async (id: string) => {
    try {
      await Axios.delete(`crm/activities/${id}`);
      toast.success('Activity removed');
      return { id };
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || error);
      throw error;
    }
  },
);

// ** Custom field values (per record)
export const fetchFieldValues = createAsyncThunk(
  'crm/fetchFieldValues',
  async (params: { entity: string; recordId: string }) => {
    const response = await Axios.get(
      `crm/fields/values?entity=${params.entity}&recordId=${params.recordId}`,
    );
    return response.data;
  },
);

export const applyFieldValues = createAsyncThunk(
  'crm/applyFieldValues',
  async (data: { entity: string; recordId: string; values: Record<string, any> }) => {
    try {
      const response = await Axios.put('crm/fields/values', data);
      toast.success('Custom fields saved');
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || error);
      throw error;
    }
  },
);

// ** Custom field definitions (admin)
export const fetchFieldDefinitions = createAsyncThunk(
  'crm/fetchFieldDefinitions',
  async (entity: string) => {
    const response = await Axios.get(`crm/fields?entity=${entity}`);
    return response.data;
  },
);

export const createFieldDefinition = createAsyncThunk(
  'crm/createFieldDefinition',
  async (data: any, { dispatch }: Redux) => {
    try {
      const response = await Axios.post('crm/fields', data);
      toast.success('Field created');
      dispatch(fetchFieldDefinitions(data.entity));
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || error);
      throw error;
    }
  },
);

export const updateFieldDefinition = createAsyncThunk(
  'crm/updateFieldDefinition',
  async ({ id, entity, data }: { id: string; entity: string; data: any }, { dispatch }: Redux) => {
    try {
      const response = await Axios.patch(`crm/fields/${id}`, data);
      toast.success('Field updated');
      dispatch(fetchFieldDefinitions(entity));
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || error);
      throw error;
    }
  },
);

export const deleteFieldDefinition = createAsyncThunk(
  'crm/deleteFieldDefinition',
  async ({ id, entity }: { id: string; entity: string }, { dispatch }: Redux) => {
    try {
      await Axios.delete(`crm/fields/${id}`);
      toast.success('Field archived');
      dispatch(fetchFieldDefinitions(entity));
      return { id };
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || error);
      throw error;
    }
  },
);

// ** Saved views
export const fetchSavedViews = createAsyncThunk(
  'crm/fetchSavedViews',
  async (entity: string) => {
    const response = await Axios.get(`crm/saved-views?entity=${entity}`);
    return response.data;
  },
);

export const createSavedView = createAsyncThunk(
  'crm/createSavedView',
  async (data: any, { dispatch }: Redux) => {
    try {
      const response = await Axios.post('crm/saved-views', data);
      toast.success('View saved');
      dispatch(fetchSavedViews(data.entity));
      return response.data;
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || error);
      throw error;
    }
  },
);

export const deleteSavedView = createAsyncThunk(
  'crm/deleteSavedView',
  async ({ id, entity }: { id: string; entity: string }, { dispatch }: Redux) => {
    try {
      await Axios.delete(`crm/saved-views/${id}`);
      toast.success('View deleted');
      dispatch(fetchSavedViews(entity));
      return { id };
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
    contacts: { ...emptyList, fieldColumns: [] as any[] },
    companies: { ...emptyList, fieldColumns: [] as any[] },
    deals: { ...emptyList, fieldColumns: [] as any[] },
    selectedRecord: null as any,
    loadingDetail: false,
    activities: { data: [] as any[], loading: false },
    fieldValues: { data: [] as any[], loading: false },
    fieldDefinitions: { data: [] as any[] },
    savedViews: { data: [] as any[] },
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
      state.contacts.data = action.payload?.rows || [];
      state.contacts.count = action.payload?.total || 0;
      state.contacts.fieldColumns = action.payload?.fieldColumns || [];
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
      state.companies.data = action.payload?.rows || [];
      state.companies.count = action.payload?.total || 0;
      state.companies.fieldColumns = action.payload?.fieldColumns || [];
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
      state.deals.data = action.payload?.rows || [];
      state.deals.count = action.payload?.total || 0;
    });
    builder.addCase(fetchDeals.rejected, (state) => {
      state.loadingDeals = false;
    });

    // Record detail (byId) — shared selectedRecord slot
    const detailPending = (state: any) => {
      state.loadingDetail = true;
    };
    const detailFulfilled = (state: any, action: any) => {
      state.loadingDetail = false;
      state.selectedRecord = action.payload || null;
    };
    const detailRejected = (state: any) => {
      state.loadingDetail = false;
    };
    builder.addCase(fetchContactById.pending, detailPending);
    builder.addCase(fetchContactById.fulfilled, detailFulfilled);
    builder.addCase(fetchContactById.rejected, detailRejected);
    builder.addCase(fetchCompanyById.pending, detailPending);
    builder.addCase(fetchCompanyById.fulfilled, detailFulfilled);
    builder.addCase(fetchCompanyById.rejected, detailRejected);
    builder.addCase(fetchDealById.pending, detailPending);
    builder.addCase(fetchDealById.fulfilled, detailFulfilled);
    builder.addCase(fetchDealById.rejected, detailRejected);

    // Activities
    builder.addCase(fetchActivities.pending, (state) => {
      state.activities.loading = true;
    });
    builder.addCase(fetchActivities.fulfilled, (state, action) => {
      state.activities.loading = false;
      state.activities.data = action.payload?.rows || [];
    });
    builder.addCase(fetchActivities.rejected, (state) => {
      state.activities.loading = false;
    });

    // Field values
    builder.addCase(fetchFieldValues.pending, (state) => {
      state.fieldValues.loading = true;
    });
    builder.addCase(fetchFieldValues.fulfilled, (state, action) => {
      state.fieldValues.loading = false;
      state.fieldValues.data = action.payload || [];
    });
    builder.addCase(fetchFieldValues.rejected, (state) => {
      state.fieldValues.loading = false;
    });

    // Field definitions
    builder.addCase(fetchFieldDefinitions.fulfilled, (state, action) => {
      state.fieldDefinitions.data = action.payload || [];
    });

    // Saved views
    builder.addCase(fetchSavedViews.fulfilled, (state, action) => {
      state.savedViews.data = action.payload || [];
    });
  },
});

export default crmSlice.reducer;
