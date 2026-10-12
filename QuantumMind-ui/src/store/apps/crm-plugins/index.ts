// ** CRM plugins (crm-plugins-service-desk Phase 2)
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { toast } from 'react-hot-toast';
import Axios from 'src/helper/Axios';
import { CrmPlugin } from 'src/views/crm/plugins/crmPlugins';

const CACHE_KEY = 'crmPlugins';

/** Last known list, so the menu does not flicker on reload. */
const readCache = (): CrmPlugin[] | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    const v = raw ? JSON.parse(raw) : null;
    return Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
};
const writeCache = (plugins: CrmPlugin[]) => {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(plugins));
  } catch {
    // storage full or blocked: the menu simply refetches
  }
};

export const fetchCrmPlugins = createAsyncThunk('crmPlugins/fetch', async () => {
  const response = await Axios.get('crm/plugins');
  return response.data as CrmPlugin[];
});

/** What a toggle would change, for the confirm dialog (no write). */
export const previewCrmPluginToggle = async (key: string, enabled: boolean) => {
  const response = await Axios.patch(`crm/plugins/${encodeURIComponent(key)}?dryRun=true`, { enabled });
  return response.data as { changes: { key: string; label: string; enabled: boolean }[] };
};

export const setCrmPluginEnabled = createAsyncThunk(
  'crmPlugins/setEnabled',
  async ({ key, enabled }: { key: string; enabled: boolean }) => {
    try {
      const response = await Axios.patch(`crm/plugins/${encodeURIComponent(key)}`, { enabled });
      const changes: { label: string; enabled: boolean }[] = response.data?.changes || [];
      if (changes.length) {
        toast.success(
          `${changes.map((c) => c.label).join(', ')} turned ${enabled ? 'on' : 'off'}`,
        );
      }
      return response.data.plugins as CrmPlugin[];
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Could not change the plugin');
      throw error;
    }
  },
);

export const reorderCrmPlugins = createAsyncThunk('crmPlugins/reorder', async (keys: string[]) => {
  try {
    const response = await Axios.put('crm/plugins/order', { keys });
    return response.data as CrmPlugin[];
  } catch (error: any) {
    toast.error(error?.response?.data?.message || error?.message || 'Could not save the order');
    throw error;
  }
});

const slice = createSlice({
  name: 'crmPlugins',
  initialState: {
    /** null = not loaded (or failed): the dashboard shows everything. */
    list: null as CrmPlugin[] | null,
    loading: false,
    saving: false,
  },
  reducers: {
    /** Called after mount (never during SSR) so the first paint matches the server. */
    loadCachedCrmPlugins: (state) => {
      if (!state.list) state.list = readCache();
    },
  },
  extraReducers: (builder) => {
    const set = (state: any, plugins: CrmPlugin[]) => {
      if (!Array.isArray(plugins)) return;
      state.list = plugins;
      writeCache(plugins);
    };
    builder.addCase(fetchCrmPlugins.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchCrmPlugins.fulfilled, (state, action) => {
      state.loading = false;
      set(state, action.payload);
    });
    builder.addCase(fetchCrmPlugins.rejected, (state) => {
      state.loading = false;
    });
    for (const thunk of [setCrmPluginEnabled, reorderCrmPlugins]) {
      builder.addCase(thunk.pending, (state) => {
        state.saving = true;
      });
      builder.addCase(thunk.fulfilled, (state, action) => {
        state.saving = false;
        set(state, action.payload);
      });
      builder.addCase(thunk.rejected, (state) => {
        state.saving = false;
      });
    }
  },
});

export const { loadCachedCrmPlugins } = slice.actions;

export default slice.reducer;
