// ** Service desk board, list and drawer (crm-plugins-service-desk Phase 4)
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { toast } from 'react-hot-toast';
import Axios from 'src/helper/Axios';
import {
  applyEvent,
  Column,
  DropTarget,
  findCard,
  moveCard,
  neighbours,
  RealtimeEvent,
  replaceCard,
} from 'src/views/crm/service-requests/boardState';
import { DEFAULT_FILTERS, filtersToApiParams, matchesFilters, SrFilters } from 'src/views/crm/service-requests/srFilters';
import { SrEvent } from 'src/views/crm/service-requests/srHistory';

export interface SrStage {
  id: string;
  name: string;
  color?: string | null;
  category: 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'DONE' | string;
  isDefault?: boolean;
  position?: number;
}

export interface SrContact {
  id: string;
  firstName?: string;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  isAnonymous?: boolean;
}

export interface SrCard {
  id: string;
  ref: string;
  subject: string;
  stageId: string;
  boardPosition: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string;
  emergency: boolean;
  tags: string[];
  contactId: string | null;
  assigneeId: string | null;
  assigneeName: string | null;
  source: string;
  channel: string | null;
  botId: string | null;
  botName: string | null;
  conversationId: string | null;
  visitorId: string | null;
  incidentId: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  stage: SrStage;
  contact: SrContact | null;
}

export interface SrSummary {
  overview?: string;
  customerAsk?: string;
  actionsTaken?: string;
  nextStep?: string;
  generatedAt?: string;
}

export interface SrDetail extends SrCard {
  description?: string | null;
  summary?: SrSummary | null;
  summaryError?: string | null;
  transcriptAt?: string | null;
  firstResponseAt?: string | null;
  stageChangedAt?: string | null;
}

export interface SrAssignee {
  id: string;
  name: string;
  email?: string;
  role?: string;
  avatar?: string | null;
}

export interface SrComment {
  id: string;
  authorId: string;
  authorName?: string | null;
  body: string;
  editedAt?: string | null;
  createdAt: string;
}

export interface SrTranscript {
  source: 'live' | 'snapshot' | 'none';
  at?: string | null;
  lines: { at: string; from: string; name?: string; type: string; text: string }[];
}

export const BOARD_PAGE = 50;
const base = 'crm/service-requests';
export const errorText = (e: any, fallback: string) => {
  const m = e?.response?.data?.message ?? e?.message;
  return (Array.isArray(m) ? m.join(', ') : m) || fallback;
};

// --------------------------------------------------------------- board / list

export const fetchSrBoard = createAsyncThunk('crmSr/board', async (filters: SrFilters) => {
  const r = await Axios.get(base, { params: { ...filtersToApiParams(filters), view: 'board', take: BOARD_PAGE } });
  return r.data.columns as Column<SrCard>[];
});

export const loadMoreSrColumn = createAsyncThunk(
  'crmSr/loadMore',
  async ({ stageId }: { stageId: string }, { getState }) => {
    const st = (getState() as any).crmServiceRequests as SrState;
    const col = st.board.columns?.find((c) => c.stage.id === stageId);
    const r = await Axios.get(base, {
      params: { ...filtersToApiParams(st.filters), view: 'board', column: stageId, skip: col?.data.length ?? 0, take: BOARD_PAGE },
    });
    return r.data.columns?.[0] as Column<SrCard> | undefined;
  },
);

export interface SrListQuery {
  filters: SrFilters;
  page: number;
  pageSize: number;
  sort?: string;
  dir?: 'asc' | 'desc';
}

export const fetchSrList = createAsyncThunk('crmSr/list', async (q: SrListQuery) => {
  const r = await Axios.get(base, {
    params: {
      ...filtersToApiParams(q.filters),
      view: 'list',
      skip: q.page * q.pageSize,
      take: q.pageSize,
      sort: q.sort || 'created',
      dir: q.dir || 'desc',
    },
  });
  return r.data as { data: SrCard[]; count: number };
});

/**
 * Drop or "Move to…": optimistic, then the server's card; on failure the
 * card goes back where it was and the error shows (R11.4).
 */
export const moveSr = createAsyncThunk(
  'crmSr/move',
  async ({ id, target }: { id: string; target: DropTarget }, { getState, dispatch }) => {
    const st = (getState() as any).crmServiceRequests as SrState;
    const cols = st.board.columns || [];
    const hit = findCard(cols, id);
    const from = hit ? { stageId: cols[hit.col].stage.id, index: hit.index } : null;
    const { aboveId, belowId } = neighbours(cols, id, target);
    dispatch(slice.actions.optimisticMove({ id, target }));
    try {
      const r = await Axios.post(`${base}/${encodeURIComponent(id)}/move`, {
        stageId: target.stageId,
        ...(aboveId ? { aboveId } : {}),
        ...(belowId ? { belowId } : {}),
      });
      return r.data as SrDetail;
    } catch (e) {
      if (from) dispatch(slice.actions.optimisticMove({ id, target: from }));
      toast.error(errorText(e, 'Could not move the request'));
      throw e;
    }
  },
);

// --------------------------------------------------------------- reference data

export const fetchSrStages = createAsyncThunk('crmSr/stages', async () => {
  const r = await Axios.get('crm/service-request-stages');
  return r.data as SrStage[];
});

export const fetchSrAssignees = createAsyncThunk('crmSr/assignees', async () => {
  const r = await Axios.get(`${base}/assignees`);
  return r.data as SrAssignee[];
});

// --------------------------------------------------------------- detail

export const fetchSrDetail = createAsyncThunk<SrDetail, string, { rejectValue: { status?: number; message: string } }>(
  'crmSr/detail',
  async (id, { rejectWithValue }) => {
    try {
      const r = await Axios.get(`${base}/${encodeURIComponent(id)}`);
      return r.data as SrDetail;
    } catch (e: any) {
      return rejectWithValue({ status: e?.response?.status, message: errorText(e, 'Could not load the request') });
    }
  },
);

export const fetchSrComments = createAsyncThunk('crmSr/comments', async (id: string) => {
  const r = await Axios.get(`${base}/${encodeURIComponent(id)}/comments`);
  return { id, data: (Array.isArray(r.data) ? r.data : []) as SrComment[] };
});

export const SR_EVENTS_PAGE = 30;
export const fetchSrEvents = createAsyncThunk('crmSr/events', async ({ id, skip = 0 }: { id: string; skip?: number }) => {
  const r = await Axios.get(`${base}/${encodeURIComponent(id)}/events`, { params: { skip, take: SR_EVENTS_PAGE } });
  const data: SrEvent[] = Array.isArray(r.data?.data) ? r.data.data : [];
  return { id, skip, data, count: Number(r.data?.count) || data.length };
});

export const fetchSrTranscript = createAsyncThunk('crmSr/transcript', async (id: string) => {
  const r = await Axios.get(`${base}/${encodeURIComponent(id)}/transcript`);
  const t = r.data as SrTranscript | undefined;
  return { id, data: { source: t?.source ?? 'none', at: t?.at ?? null, lines: Array.isArray(t?.lines) ? t!.lines : [] } };
});

/** Runs a write that returns the saved request; toasts its own error. */
async function saved(call: Promise<any>, fallback: string): Promise<SrDetail> {
  try {
    return (await call).data as SrDetail;
  } catch (e) {
    toast.error(errorText(e, fallback));
    throw e;
  }
}

export type SrPatch = Partial<{
  subject: string;
  description: string | null;
  priority: string;
  tags: string[];
  contactId: string | null;
  emergency: boolean;
}>;

export const updateSr = createAsyncThunk('crmSr/update', ({ id, patch }: { id: string; patch: SrPatch }) =>
  saved(Axios.patch(`${base}/${encodeURIComponent(id)}`, patch), 'Could not save the change'),
);

export const assignSr = createAsyncThunk('crmSr/assign', ({ id, assigneeId }: { id: string; assigneeId: string | null }) =>
  saved(Axios.post(`${base}/${encodeURIComponent(id)}/assign`, { assigneeId }), 'Could not change the assignee'),
);

export const assignSrToMe = createAsyncThunk('crmSr/assignToMe', (id: string) =>
  saved(Axios.post(`${base}/${encodeURIComponent(id)}/assign-to-me`), 'Could not assign the request to you'),
);

export const createSr = createAsyncThunk('crmSr/create', (body: Record<string, any>) =>
  saved(Axios.post(base, body), 'Could not create the request'),
);

export const regenerateSrSummary = createAsyncThunk('crmSr/summary', async (id: string) => {
  try {
    const r = await Axios.post(`${base}/${encodeURIComponent(id)}/summary`);
    return { id, ...(r.data as { summary: SrSummary | null; summaryError: string | null }) };
  } catch (e) {
    toast.error(errorText(e, 'Could not generate the summary'));
    throw e;
  }
});

export const addSrComment = createAsyncThunk('crmSr/addComment', async ({ id, body }: { id: string; body: string }) => {
  try {
    const r = await Axios.post(`${base}/${encodeURIComponent(id)}/comments`, { body });
    return { id, comment: r.data as SrComment };
  } catch (e) {
    toast.error(errorText(e, 'Could not add the note'));
    throw e;
  }
});

export const editSrComment = createAsyncThunk(
  'crmSr/editComment',
  async ({ id, commentId, body }: { id: string; commentId: string; body: string }) => {
    try {
      const r = await Axios.patch(`${base}/${encodeURIComponent(id)}/comments/${encodeURIComponent(commentId)}`, { body });
      return { id, comment: r.data as SrComment };
    } catch (e) {
      toast.error(errorText(e, 'Could not edit the note'));
      throw e;
    }
  },
);

export const deleteSrComment = createAsyncThunk(
  'crmSr/deleteComment',
  async ({ id, commentId }: { id: string; commentId: string }) => {
    try {
      await Axios.delete(`${base}/${encodeURIComponent(id)}/comments/${encodeURIComponent(commentId)}`);
      return { id, commentId };
    } catch (e) {
      toast.error(errorText(e, 'Could not delete the note'));
      throw e;
    }
  },
);

/**
 * A `crm:service-request` push (R18.2): board and list patched in place;
 * an open drawer for the same request refreshes its notes and history.
 */
export const srRealtime = createAsyncThunk('crmSr/realtime', async (e: RealtimeEvent<SrCard>, { getState, dispatch }) => {
  dispatch(slice.actions.applyRealtime(e));
  const st = (getState() as any).crmServiceRequests as SrState;
  if (st.detail.id !== e?.id || !e.data) return;
  if (e.kind === 'commented') dispatch(fetchSrComments(e.id));
  dispatch(fetchSrEvents({ id: e.id }));
  // The card push lacks summary/description; the summary job ends with an update.
  if (e.kind === 'updated') dispatch(fetchSrDetail(e.id));
});

// --------------------------------------------------------------- state

export interface SrState {
  filters: SrFilters;
  /** Signed-in user id, for "me" in live matching. */
  me: string | null;
  draggingId: string | null;
  /** Bumped on a socket reconnect: open views refetch (pushes may be lost). */
  gap: number;
  board: { columns: Column<SrCard>[] | null; loading: boolean; error: string | null; requestId: string | null; loadingMore: string[] };
  list: { rows: SrCard[]; count: number; loading: boolean; requestId: string | null };
  stages: SrStage[] | null;
  assignees: SrAssignee[] | null;
  detail: {
    id: string | null;
    data: SrDetail | null;
    loading: boolean;
    /** 'missing' when the request is gone or not in this org. */
    error: string | null;
    comments: SrComment[] | null;
    events: { data: SrEvent[]; count: number } | null;
    transcript: SrTranscript | null;
    summaryLoading: boolean;
  };
}

const emptyDetail = (id: string | null = null): SrState['detail'] => ({
  id,
  data: null,
  loading: false,
  error: null,
  comments: null,
  events: null,
  transcript: null,
  summaryLoading: false,
});

const initialState: SrState = {
  filters: DEFAULT_FILTERS,
  me: null,
  draggingId: null,
  gap: 0,
  board: { columns: null, loading: false, error: null, requestId: null, loadingMore: [] },
  list: { rows: [], count: 0, loading: false, requestId: null },
  stages: null,
  assignees: null,
  detail: emptyDetail(),
};

/** A saved request: board card, list row and the open drawer follow it. */
const applySaved = (state: SrState, sr: SrDetail | undefined) => {
  if (!sr?.id) return;
  if (state.board.columns) {
    const m = matchesFilters(sr, state.filters, state.me ?? undefined);
    const shown = !!findCard(state.board.columns, sr.id);
    // Your own change keeps the card in view until the next load, unless it
    // clearly no longer matches (e.g. you reassigned it away from "me").
    if (shown && m === false) {
      state.board.columns = applyEvent(
        state.board.columns,
        { kind: 'updated', id: sr.id, stageId: sr.stageId, data: sr },
        { filters: state.filters, me: state.me ?? undefined },
      );
    } else if (shown) state.board.columns = replaceCard(state.board.columns, sr);
  }
  state.list.rows = state.list.rows.map((r) => (r.id === sr.id ? { ...r, ...sr } : r));
  if (state.detail.id === sr.id) state.detail.data = { ...(state.detail.data || ({} as SrDetail)), ...sr };
};

const slice = createSlice({
  name: 'crmServiceRequests',
  initialState,
  reducers: {
    setSrFilters: (state, a: PayloadAction<SrFilters>) => {
      state.filters = a.payload;
    },
    setSrMe: (state, a: PayloadAction<string | null>) => {
      state.me = a.payload;
    },
    setSrStages: (state, a: PayloadAction<SrStage[]>) => {
      if (Array.isArray(a.payload)) state.stages = a.payload;
    },
    setSrDragging: (state, a: PayloadAction<string | null>) => {
      state.draggingId = a.payload;
    },
    srSocketGap: (state) => {
      state.gap += 1;
    },
    openSrDetail: (state, a: PayloadAction<string>) => {
      if (state.detail.id !== a.payload) state.detail = emptyDetail(a.payload);
    },
    closeSrDetail: (state) => {
      state.detail = emptyDetail();
    },
    optimisticMove: (state, a: PayloadAction<{ id: string; target: DropTarget }>) => {
      if (state.board.columns) state.board.columns = moveCard(state.board.columns, a.payload.id, a.payload.target);
    },
    applyRealtime: (state, a: PayloadAction<RealtimeEvent<SrCard>>) => {
      const e = a.payload;
      if (!e?.id) return;
      if (state.board.columns) {
        state.board.columns = applyEvent(state.board.columns, e, {
          filters: state.filters,
          me: state.me ?? undefined,
          draggingId: state.draggingId,
        });
      }
      // The list keeps its server order and paging; rows are patched only.
      if (!e.data || e.kind === 'deleted') {
        const n = state.list.rows.length;
        state.list.rows = state.list.rows.filter((r) => r.id !== e.id);
        if (state.list.rows.length < n) state.list.count = Math.max(0, state.list.count - 1);
      } else state.list.rows = state.list.rows.map((r) => (r.id === e.id ? { ...r, ...e.data! } : r));
      if (state.detail.id === e.id) {
        if (!e.data || e.kind === 'deleted') state.detail.error = 'missing';
        else if (state.detail.data) state.detail.data = { ...state.detail.data, ...e.data };
      }
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchSrBoard.pending, (state, a) => {
      state.board.loading = true;
      state.board.error = null;
      state.board.requestId = a.meta.requestId;
    });
    b.addCase(fetchSrBoard.fulfilled, (state, a) => {
      // A slower answer for older filters never overwrites a newer one.
      if (state.board.requestId !== a.meta.requestId) return;
      state.board.loading = false;
      state.board.columns = Array.isArray(a.payload) ? a.payload : [];
      state.board.loadingMore = [];
    });
    b.addCase(fetchSrBoard.rejected, (state, a) => {
      if (state.board.requestId !== a.meta.requestId) return;
      state.board.loading = false;
      state.board.error = a.error?.message || 'Could not load the board';
    });

    b.addCase(loadMoreSrColumn.pending, (state, a) => {
      state.board.loadingMore.push(a.meta.arg.stageId);
    });
    b.addCase(loadMoreSrColumn.fulfilled, (state, a) => {
      const id = a.meta.arg.stageId;
      state.board.loadingMore = state.board.loadingMore.filter((x) => x !== id);
      const page = a.payload;
      const col = state.board.columns?.find((c) => c.stage.id === id);
      if (!page || !col) return;
      // A live insert may already hold some of these cards.
      const seen = new Set(col.data.map((c) => c.id));
      col.data.push(...page.data.filter((c) => !seen.has(c.id)));
      col.count = page.count;
      col.hasMore = page.hasMore;
    });
    b.addCase(loadMoreSrColumn.rejected, (state, a) => {
      state.board.loadingMore = state.board.loadingMore.filter((x) => x !== a.meta.arg.stageId);
      toast.error('Could not load more requests');
    });

    b.addCase(fetchSrList.pending, (state, a) => {
      state.list.loading = true;
      state.list.requestId = a.meta.requestId;
    });
    b.addCase(fetchSrList.fulfilled, (state, a) => {
      if (state.list.requestId !== a.meta.requestId) return;
      state.list.loading = false;
      state.list.rows = a.payload?.data || [];
      state.list.count = a.payload?.count || 0;
    });
    b.addCase(fetchSrList.rejected, (state, a) => {
      if (state.list.requestId !== a.meta.requestId) return;
      state.list.loading = false;
      toast.error('Could not load the requests');
    });

    b.addCase(moveSr.fulfilled, (state, a) => applySaved(state, a.payload));

    b.addCase(fetchSrStages.fulfilled, (state, a) => {
      state.stages = a.payload;
    });
    b.addCase(fetchSrAssignees.fulfilled, (state, a) => {
      state.assignees = a.payload;
    });

    b.addCase(fetchSrDetail.pending, (state, a) => {
      if (state.detail.id !== a.meta.arg) state.detail = emptyDetail(a.meta.arg);
      // A refresh keeps showing the old data; only the first load spins.
      state.detail.loading = !state.detail.data;
    });
    b.addCase(fetchSrDetail.fulfilled, (state, a) => {
      if (state.detail.id !== a.meta.arg) return;
      state.detail.loading = false;
      state.detail.error = null;
      state.detail.data = a.payload;
    });
    b.addCase(fetchSrDetail.rejected, (state, a) => {
      if (state.detail.id !== a.meta.arg) return;
      state.detail.loading = false;
      const status = a.payload?.status;
      state.detail.error = status === 404 || status === 400 ? 'missing' : a.payload?.message || 'Could not load the request';
    });
    b.addCase(fetchSrComments.fulfilled, (state, a) => {
      if (state.detail.id === a.payload.id) state.detail.comments = a.payload.data;
    });
    b.addCase(fetchSrEvents.fulfilled, (state, a) => {
      if (state.detail.id !== a.payload.id) return;
      const prev = a.payload.skip && state.detail.events ? state.detail.events.data : [];
      const seen = new Set(prev.map((x) => x.id));
      state.detail.events = { data: [...prev, ...a.payload.data.filter((x) => !seen.has(x.id))], count: a.payload.count };
    });
    b.addCase(fetchSrTranscript.fulfilled, (state, a) => {
      if (state.detail.id === a.payload.id) state.detail.transcript = a.payload.data;
    });

    for (const t of [updateSr, assignSr, assignSrToMe]) {
      b.addCase(t.fulfilled, (state, a) => applySaved(state, a.payload));
    }

    b.addCase(regenerateSrSummary.pending, (state, a) => {
      if (state.detail.id === a.meta.arg) state.detail.summaryLoading = true;
    });
    b.addCase(regenerateSrSummary.fulfilled, (state, a) => {
      if (state.detail.id !== a.payload.id) return;
      state.detail.summaryLoading = false;
      if (state.detail.data) {
        // A failed run keeps the previous summary (R15.5).
        if (a.payload.summary) state.detail.data.summary = a.payload.summary;
        state.detail.data.summaryError = a.payload.summaryError ?? null;
      }
    });
    b.addCase(regenerateSrSummary.rejected, (state, a) => {
      if (state.detail.id === a.meta.arg) state.detail.summaryLoading = false;
    });

    b.addCase(addSrComment.fulfilled, (state, a) => {
      if (state.detail.id !== a.payload.id) return;
      const list = state.detail.comments || [];
      if (!list.some((c) => c.id === a.payload.comment.id)) state.detail.comments = [...list, a.payload.comment];
    });
    b.addCase(editSrComment.fulfilled, (state, a) => {
      if (state.detail.id !== a.payload.id || !state.detail.comments) return;
      state.detail.comments = state.detail.comments.map((c) => (c.id === a.payload.comment.id ? { ...c, ...a.payload.comment } : c));
    });
    b.addCase(deleteSrComment.fulfilled, (state, a) => {
      if (state.detail.id !== a.payload.id || !state.detail.comments) return;
      state.detail.comments = state.detail.comments.filter((c) => c.id !== a.payload.commentId);
    });
  },
});

export const { setSrFilters, setSrMe, setSrStages, setSrDragging, srSocketGap, openSrDetail, closeSrDetail } = slice.actions;
export default slice.reducer;
