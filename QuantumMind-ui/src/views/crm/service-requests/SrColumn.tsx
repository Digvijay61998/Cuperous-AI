// ** A board column: drop zone, cards, load more (crm-plugins-service-desk R11.1, R11.6)
import { DragEvent, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import type { SrCard as Card_, SrStage } from 'src/store/apps/crm-service-requests';
import type { Column } from './boardState';
import SrCard from './SrCard';

interface Props {
  column: Column<Card_>;
  stages: SrStage[];
  draggingId: string | null;
  loadingMore: boolean;
  onOpen: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDrop: (id: string, stageId: string, domIndex: number) => void;
  onMoveTo: (id: string, stageId: string) => void;
  onKeyMove: (id: string, key: string) => void;
  onLoadMore: (stageId: string) => void;
}

/** Slot under the pointer: before the first card whose middle is below it. */
const slotAt = (list: HTMLElement | null, y: number): number => {
  if (!list) return 0;
  const cards = Array.from(list.querySelectorAll<HTMLElement>('[data-sr-card]'));
  const i = cards.findIndex((el) => {
    const r = el.getBoundingClientRect();
    return y < r.top + r.height / 2;
  });
  return i === -1 ? cards.length : i;
};

const SrColumn = ({ column, stages, draggingId, loadingMore, onOpen, onDragStart, onDragEnd, onDrop, onMoveTo, onKeyMove, onLoadMore }: Props) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [slot, setSlot] = useState<number | null>(null);
  const { stage } = column;
  const left = Math.max(0, column.count - column.data.length);

  const over = (e: DragEvent) => {
    if (!draggingId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const s = slotAt(listRef.current, e.clientY);
    if (s !== slot) setSlot(s);
  };

  const drop = (e: DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggingId;
    const s = slotAt(listRef.current, e.clientY);
    setSlot(null);
    if (id) onDrop(id, stage.id, s);
  };

  const indicator = <Box aria-hidden sx={{ height: 3, borderRadius: 2, bgcolor: 'primary.main', my: 0.5 }} />;

  return (
    <Box
      component="section"
      aria-label={`${stage.name}, ${column.count} request${column.count === 1 ? '' : 's'}`}
      onDragOver={over}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setSlot(null);
      }}
      onDrop={drop}
      sx={{
        width: 290,
        minWidth: 290,
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'action.hover',
        borderRadius: 1,
        maxHeight: 'calc(100vh - 300px)',
        minHeight: 240,
        outline: (t) => (slot !== null ? `2px dashed ${t.palette.primary.main}` : 'none'),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 3, py: 2.5, borderTop: `3px solid ${stage.color || '#8592A3'}`, borderRadius: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }} noWrap>
          {stage.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {column.count}
        </Typography>
      </Box>
      <Box ref={listRef} sx={{ px: 2, pb: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {column.data.map((card, i) => (
          <Box key={card.id}>
            {slot === i && indicator}
            <SrCard
              card={card}
              stages={stages}
              dragging={draggingId === card.id}
              onOpen={onOpen}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onMoveTo={onMoveTo}
              onKeyMove={onKeyMove}
            />
          </Box>
        ))}
        {slot === column.data.length && indicator}
        {!column.data.length && (
          <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'center', py: 6 }}>
            No requests
          </Typography>
        )}
        {column.hasMore && (
          <Button size="small" disabled={loadingMore} onClick={() => onLoadMore(stage.id)}>
            {loadingMore ? <CircularProgress size={16} /> : `Load more (${left} more)`}
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default SrColumn;
