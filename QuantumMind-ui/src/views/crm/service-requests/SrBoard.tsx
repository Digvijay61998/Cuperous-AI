// ** The board (crm-plugins-service-desk R11.1–R11.4, R11.6, R18.2)
import { useCallback, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

import { useDispatch, useSelector, useStore } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import { loadMoreSrColumn, moveSr, setSrDragging, SrState } from 'src/store/apps/crm-service-requests';
import { dropTarget, DropTarget, keyboardTarget, moveAnnouncement } from './boardState';
import SrColumn from './SrColumn';

interface Props {
  onOpen: (id: string) => void;
  onRetry: () => void;
}

const SrBoard = ({ onOpen, onRetry }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const store = useStore();
  const st = useSelector((s: RootState) => (s as any).crmServiceRequests as SrState);
  const { columns, loading, error, loadingMore } = st.board;
  const [said, setSaid] = useState('');

  const stageKey = (columns || []).map((c) => `${c.stage.id}:${c.stage.name}:${c.stage.color}`).join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stages = useMemo(() => (columns || []).map((c) => c.stage), [stageKey]);

  const move = useCallback(
    async (id: string, target: DropTarget, focus = false) => {
      const res = await dispatch(moveSr({ id, target }));
      const cols = ((store.getState() as any).crmServiceRequests as SrState).board.columns;
      if (moveSr.fulfilled.match(res)) setSaid(moveAnnouncement(cols || [], id));
      else setSaid('The move was not saved; the request is back where it was.');
      // Keep keyboard focus on the moved card.
      if (focus) {
        requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-sr-card="${CSS.escape(id)}"]`)?.focus());
      }
    },
    [dispatch, store],
  );

  const onDrop = useCallback(
    (id: string, stageId: string, domIndex: number) => {
      dispatch(setSrDragging(null));
      const target = dropTarget(columns || [], id, stageId, domIndex);
      if (target) void move(id, target);
    },
    [columns, dispatch, move],
  );

  const onKeyMove = useCallback(
    (id: string, key: string) => {
      const target = keyboardTarget(columns || [], id, key);
      if (target) void move(id, target, true);
      else setSaid('Cannot move further that way.');
    },
    [columns, move],
  );

  const onMoveTo = useCallback((id: string, stageId: string) => void move(id, { stageId, index: 0 }), [move]);
  const onDragStart = useCallback((id: string) => dispatch(setSrDragging(id)), [dispatch]);
  const onDragEnd = useCallback(() => dispatch(setSrDragging(null)), [dispatch]);
  const onLoadMore = useCallback((stageId: string) => dispatch(loadMoreSrColumn({ stageId })), [dispatch]);

  if (error && !columns) {
    return (
      <Alert
        severity="error"
        sx={{ m: 5 }}
        action={
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }
  if (!columns) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {loading && (
        <CircularProgress size={20} sx={{ position: 'absolute', right: 16, top: -28 }} aria-label="Refreshing" />
      )}
      <Box
        role="region"
        aria-label="Service request board"
        sx={{ display: 'flex', gap: 3, overflowX: 'auto', px: 5, pb: 4, alignItems: 'flex-start' }}
      >
        {columns.map((col) => (
          <SrColumn
            key={col.stage.id}
            column={col}
            stages={stages}
            draggingId={st.draggingId}
            loadingMore={loadingMore.includes(col.stage.id)}
            onOpen={onOpen}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDrop={onDrop}
            onMoveTo={onMoveTo}
            onKeyMove={onKeyMove}
            onLoadMore={onLoadMore}
          />
        ))}
      </Box>
      <Box aria-live="polite" role="status" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        {said}
      </Box>
    </Box>
  );
};

export default SrBoard;
