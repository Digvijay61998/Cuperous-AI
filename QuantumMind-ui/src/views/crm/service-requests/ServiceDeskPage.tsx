// ** CRM → Service Requests: board / list + drawer (crm-plugins-service-desk R11–R14, R18)
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Divider from '@mui/material/Divider';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';

import { useDispatch, useSelector } from 'react-redux';
import Icon from 'src/@core/components/icon';
import { AppDispatch, RootState } from 'src/store';
import {
  fetchSrAssignees,
  fetchSrBoard,
  fetchSrList,
  fetchSrStages,
  setSrFilters,
  setSrMe,
  SrState,
} from 'src/store/apps/crm-service-requests';
import SavedViewsBar from 'src/views/crm/SavedViewsBar';
import { canManagePlugins } from 'src/views/crm/plugins/crmPlugins';
import SrBoard from './SrBoard';
import SrCreateDialog from './SrCreateDialog';
import SrDetailDrawer from './SrDetailDrawer';
import SrFiltersBar from './SrFiltersBar';
import SrListView from './SrListView';
import StageManagerDialog from './StageManagerDialog';
import { filtersFromQuery, filtersToQuery, SrFilters } from './srFilters';

const INDEX = '/crm/service-requests';
const DETAIL = '/crm/service-requests/[srId]';
const SORTS = new Set(['created', 'updated', 'priority', 'ref', 'subject']);

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const ServiceDeskPage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const st = useSelector((s: RootState) => (s as any).crmServiceRequests as SrState);
  const user = useSelector((s: RootState) => (s.user as any)?.userData);
  const staff = canManagePlugins(user?.role);
  const myId = user?._id ? String(user._id) : null;

  const query = router.query as Record<string, string | string[] | undefined>;
  const srId = first(query.srId) || null;
  const view = first(query.view) === 'list' ? 'list' : 'board';
  const page = Math.max(0, Number(first(query.page)) || 0);
  const sort = SORTS.has(String(first(query.sort))) ? String(first(query.sort)) : 'created';
  const dir = first(query.dir) === 'asc' ? 'asc' : 'desc';
  const [pageSize, setPageSize] = useState(25);
  const [stagesOpen, setStagesOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  // Filters come from the address (R12.3). Key = the filter part only.
  const filterKey = useMemo(() => {
    if (!router.isReady) return null;
    return JSON.stringify(filtersToQuery(filtersFromQuery(query)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.asPath]);
  const filters = useMemo(() => (filterKey ? filtersFromQuery(JSON.parse(filterKey)) : null), [filterKey]);

  /** Rewrite the address, keeping what is not passed. */
  const go = useCallback(
    (next: { filters?: SrFilters; view?: string; srId?: string | null; page?: number; sort?: string; dir?: string }, push = false) => {
      const f = next.filters ?? filters ?? filtersFromQuery({});
      const id = next.srId === undefined ? srId : next.srId;
      const v = next.view ?? view;
      const p = next.page ?? (next.filters ? 0 : page);
      const q: Record<string, string> = { ...filtersToQuery(f) };
      if (v === 'list') q.view = 'list';
      if (v === 'list' && p) q.page = String(p);
      const s = next.sort ?? sort;
      const d = next.dir ?? dir;
      if (v === 'list' && (s !== 'created' || d !== 'desc')) {
        q.sort = s;
        q.dir = d;
      }
      if (id) q.srId = id;
      const target = { pathname: id ? DETAIL : INDEX, query: q };
      // Same page file: shallow (no data refetch by Next); board <-> drawer swaps page files.
      const opts = { shallow: (id ? DETAIL : INDEX) === router.pathname, scroll: false };
      void (push ? router.push(target, undefined, opts) : router.replace(target, undefined, opts));
    },
    [filters, srId, view, page, sort, dir, router],
  );

  useEffect(() => {
    dispatch(setSrMe(myId));
  }, [dispatch, myId]);

  useEffect(() => {
    if (!st.stages) dispatch(fetchSrStages());
    if (!st.assignees) dispatch(fetchSrAssignees());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (filters) dispatch(setSrFilters(filters));
  }, [dispatch, filters]);

  // Board or list for the current filters; a socket reconnect refetches.
  useEffect(() => {
    if (!filters) return;
    if (view === 'board') dispatch(fetchSrBoard(filters));
    else dispatch(fetchSrList({ filters, page, pageSize, sort, dir }));
  }, [dispatch, filters, view, page, pageSize, sort, dir, st.gap]);

  const refetch = () => {
    if (!filters) return;
    if (view === 'board') dispatch(fetchSrBoard(filters));
    else dispatch(fetchSrList({ filters, page, pageSize, sort, dir }));
  };

  // Bots and tags seen on the loaded requests, for the filter lists.
  const seen = useMemo(() => {
    const cards = view === 'board' ? (st.board.columns || []).flatMap((c) => c.data) : st.list.rows;
    const bots = new Map<string, string>();
    const tags = new Set<string>();
    let contact: string | null = null;
    for (const c of cards) {
      if (c.botId) bots.set(c.botId, c.botName || 'Bot');
      for (const t of c.tags || []) tags.add(t);
      if (filters?.contactId && c.contactId === filters.contactId && c.contact) {
        contact = [c.contact.firstName, c.contact.lastName].filter(Boolean).join(' ') || c.contact.email || null;
      }
    }
    for (const b of filters?.botId || []) if (!bots.has(b)) bots.set(b, 'Bot');
    return {
      bots: [...bots.entries()].map(([value, label]) => ({ value, label })),
      tags: [...tags].sort(),
      contact,
    };
  }, [view, st.board.columns, st.list.rows, filters]);

  const open = useCallback((id: string) => go({ srId: id }, true), [go]);

  if (!filters) return null;

  return (
    <Card sx={{ boxShadow: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px' }}>
      <Box sx={{ p: 5, display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          Service Requests
        </Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={view}
          onChange={(_e, v) => v && go({ view: v, page: 0 })}
          aria-label="View"
        >
          <ToggleButton value="board" aria-label="Board">
            <Icon icon="bx:columns" fontSize={18} />
            <Box component="span" sx={{ ml: 1 }}>
              Board
            </Box>
          </ToggleButton>
          <ToggleButton value="list" aria-label="List">
            <Icon icon="bx:list-ul" fontSize={18} />
            <Box component="span" sx={{ ml: 1 }}>
              List
            </Box>
          </ToggleButton>
        </ToggleButtonGroup>
        {staff && (
          <Button variant="outlined" size="small" onClick={() => setStagesOpen(true)} startIcon={<Icon icon="bx:cog" />}>
            Stages
          </Button>
        )}
        <Button variant="contained" size="small" onClick={() => setCreateOpen(true)} startIcon={<Icon icon="bx:plus" />}>
          New request
        </Button>
      </Box>
      <Divider sx={{ m: '0 !important' }} />
      <SrFiltersBar
        filters={filters}
        onChange={(f) => go({ filters: f })}
        stages={st.stages || (st.board.columns || []).map((c) => c.stage)}
        assignees={st.assignees || []}
        botOptions={seen.bots}
        tagOptions={seen.tags}
        contactLabel={seen.contact}
      />
      <Divider sx={{ m: '0 !important' }} />
      <SavedViewsBar
        entity="SERVICE_REQUEST"
        currentFilters={{ ...filtersToQuery(filters), ...(view === 'list' ? { view: 'list' } : {}) }}
        onApply={(saved) => go({ filters: filtersFromQuery(saved || {}), view: saved?.view === 'list' ? 'list' : 'board' })}
      />
      <Divider sx={{ m: '0 !important', mb: '16px !important' }} />
      {view === 'board' ? (
        <SrBoard onOpen={open} onRetry={refetch} />
      ) : (
        <SrListView
          page={page}
          pageSize={pageSize}
          sort={sort}
          dir={dir}
          onPage={(p) => go({ page: p })}
          onPageSize={(s) => {
            setPageSize(s);
            go({ page: 0 });
          }}
          onSort={(s, d) => go({ sort: s, dir: d, page: 0 })}
          onOpen={open}
        />
      )}

      <SrDetailDrawer id={srId} onClose={() => go({ srId: null }, true)} />
      {staff && (
        <StageManagerDialog
          open={stagesOpen}
          onClose={(changed) => {
            setStagesOpen(false);
            if (changed) refetch();
          }}
        />
      )}
      <SrCreateDialog
        open={createOpen}
        onClose={(created) => {
          setCreateOpen(false);
          if (created?.id) open(created.id);
        }}
      />
    </Card>
  );
};

export default ServiceDeskPage;
