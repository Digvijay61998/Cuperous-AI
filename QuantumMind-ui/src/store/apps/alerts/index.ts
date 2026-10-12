import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { toast } from 'react-hot-toast';
import Axios from 'src/helper/Axios';
import { mergeAlerts } from 'src/services/alerts/alertPolicy';
import type { HandoverAlert, SoundPrefs } from 'src/services/alerts/types';

export const FETCH_TIMEOUT_MS = 10000;
export const FETCH_RETRIES = 3;
export const FETCH_RETRY_DELAY_MS = 5000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Open alerts for the signed-in user. Retries 3x at 5s; 10s timeout per try. */
export const fetchOpenAlerts = createAsyncThunk<HandoverAlert[], void, { rejectValue: string }>(
  'alerts/fetchOpen',
  async (_, { rejectWithValue }) => {
    let lastError = '';
    for (let attempt = 0; attempt <= FETCH_RETRIES; attempt++) {
      try {
        const res = await Axios.get('/handover-alerts', { timeout: FETCH_TIMEOUT_MS });
        return Array.isArray(res.data) ? res.data : [];
      } catch (error: any) {
        lastError = error?.message || 'Failed to load alerts';
        if (attempt < FETCH_RETRIES) await sleep(FETCH_RETRY_DELAY_MS);
      }
    }
    return rejectWithValue(lastError);
  },
);

export const ackAlert = createAsyncThunk(
  'alerts/ack',
  async ({ id, resolution }: { id: string; resolution: 'opened' | 'taken_over' }) => {
    // Removal is driven by the server's `inbox:handover-acknowledged` echo;
    // a failure here just leaves the alert in place.
    await Axios.post(`/handover-alerts/${id}/ack`, { resolution });
    return id;
  },
);

/** Optimistic save; reverts to `previous` and toasts on failure (Req 6.8). */
export const saveSoundPrefs = createAsyncThunk<
  SoundPrefs,
  { next: SoundPrefs; previous: SoundPrefs },
  { rejectValue: SoundPrefs }
>('alerts/savePrefs', async ({ next, previous }, { rejectWithValue }) => {
  try {
    const res = await Axios.patch('/agent/me/notification-prefs', next);
    return {
      handoverSound: res.data?.handoverSound !== false,
      messageSound: res.data?.messageSound !== false,
    };
  } catch {
    toast.error('Sound setting was not saved. Please try again.');
    return rejectWithValue(previous);
  }
});

interface AlertsState {
  byId: Record<string, HandoverAlert>;
  loadError: boolean;
  soundBlocked: boolean;
  prefs: SoundPrefs;
}

const initialState: AlertsState = {
  byId: {},
  loadError: false,
  soundBlocked: false,
  prefs: { handoverSound: true, messageSound: true },
};

export const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    alertReceived: (state, action: PayloadAction<HandoverAlert>) => {
      state.byId[action.payload.id] = { ...state.byId[action.payload.id], ...action.payload };
    },
    alertsMerged: (state, action: PayloadAction<HandoverAlert[]>) => {
      state.byId = mergeAlerts(state.byId, action.payload);
    },
    alertAcknowledged: (state, action: PayloadAction<string>) => {
      delete state.byId[action.payload];
    },
    setSoundBlocked: (state, action: PayloadAction<boolean>) => {
      state.soundBlocked = action.payload;
    },
    /** Applied from /agent/me, the cross-tab broadcast, or a revert. */
    setPrefs: (state, action: PayloadAction<Partial<SoundPrefs>>) => {
      state.prefs = {
        handoverSound: action.payload.handoverSound ?? state.prefs.handoverSound,
        messageSound: action.payload.messageSound ?? state.prefs.messageSound,
      };
    },
    clearAlerts: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(fetchOpenAlerts.pending, (state) => {
      state.loadError = false;
    });
    builder.addCase(fetchOpenAlerts.fulfilled, (state, action) => {
      // Server truth: anything not returned is no longer open for this user.
      const fresh: Record<string, HandoverAlert> = {};
      for (const a of action.payload) fresh[a.id] = a;
      state.byId = fresh;
      state.loadError = false;
    });
    builder.addCase(fetchOpenAlerts.rejected, (state) => {
      // Keep whatever is already shown.
      state.loadError = true;
    });
    builder.addCase(saveSoundPrefs.pending, (state, action) => {
      state.prefs = action.meta.arg.next;
    });
    builder.addCase(saveSoundPrefs.fulfilled, (state, action) => {
      state.prefs = action.payload;
    });
    builder.addCase(saveSoundPrefs.rejected, (state, action) => {
      if (action.payload) state.prefs = action.payload;
    });
  },
});

export const {
  alertReceived,
  alertsMerged,
  alertAcknowledged,
  setSoundBlocked,
  setPrefs,
  clearAlerts,
} = alertsSlice.actions;

export default alertsSlice.reducer;
