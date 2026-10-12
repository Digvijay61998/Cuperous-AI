// ** A board card (crm-plugins-service-desk R11.2, R11.3)
import { DragEvent, KeyboardEvent, memo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import ListSubheader from '@mui/material/ListSubheader';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import Icon from 'src/@core/components/icon';
import CustomAvatar from 'src/@core/components/mui/avatar';
import CustomChip from 'src/@core/components/mui/chip';

import type { SrCard as Card_, SrStage } from 'src/store/apps/crm-service-requests';
import { initials } from 'src/views/crm/utils';
import { ageLabel, channelLabel, contactName, priorityColor } from './srFilters';

interface Props {
  card: Card_;
  stages: SrStage[];
  dragging: boolean;
  onOpen: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  /** Move to a stage's top ("Move to…" menu). */
  onMoveTo: (id: string, stageId: string) => void;
  /** Alt+Arrow keys. */
  onKeyMove: (id: string, key: string) => void;
}

const SrCardView = ({ card, stages, dragging, onOpen, onDragStart, onDragEnd, onMoveTo, onKeyMove }: Props) => {
  const [menu, setMenu] = useState<HTMLElement | null>(null);
  const who = contactName(card.contact) ?? 'Anonymous visitor';

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.altKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      onKeyMove(card.id, e.key);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen(card.id);
    }
  };

  return (
    <Card
      data-sr-card={card.id}
      role="button"
      tabIndex={0}
      draggable
      aria-roledescription="Draggable request"
      aria-label={`${card.ref} ${card.subject}. ${card.assigneeName || 'Unassigned'}. Press Enter to open, Alt and arrow keys to move.`}
      onDragStart={(e: DragEvent<HTMLDivElement>) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.id);
        onDragStart(card.id);
      }}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(card.id)}
      onKeyDown={handleKey}
      sx={{
        p: 3,
        cursor: 'grab',
        opacity: dragging ? 0.4 : 1,
        borderLeft: (t) => `3px solid ${card.emergency ? t.palette.error.main : 'transparent'}`,
        boxShadow: 'rgba(0, 0, 0, 0.12) 0px 1px 3px',
        '&:focus-visible': { outline: (t) => `2px solid ${t.palette.primary.main}`, outlineOffset: 2 },
        '&:hover': { boxShadow: 'rgba(0, 0, 0, 0.2) 0px 2px 6px' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          {card.ref}
        </Typography>
        {card.emergency && (
          <Tooltip title="Emergency" arrow>
            <Box component="span" sx={{ display: 'inline-flex', color: 'error.main' }}>
              <Icon icon="bx:error" fontSize={16} aria-label="Emergency" />
            </Box>
          </Tooltip>
        )}
        <Box sx={{ flex: 1 }} />
        <CustomChip rounded skin="light" size="small" label={card.priority} color={priorityColor(card.priority)} />
        <IconButton
          size="small"
          aria-label={`Move ${card.ref} to…`}
          aria-haspopup="menu"
          onClick={(e) => {
            e.stopPropagation();
            setMenu(e.currentTarget);
          }}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Icon icon="bx:dots-vertical-rounded" fontSize={18} />
        </IconButton>
      </Box>
      <Typography variant="body2" sx={{ fontWeight: 500, mb: 1.5, wordBreak: 'break-word' }}>
        {card.subject}
      </Typography>
      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 1.5 }} noWrap>
        {who} · {channelLabel(card.channel)}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <CustomAvatar
          skin="light"
          color={card.assigneeId ? 'primary' : 'secondary'}
          sx={{ width: 24, height: 24, fontSize: '0.7rem' }}
        >
          {card.assigneeId ? initials(card.assigneeName || '?') : <Icon icon="bx:user" fontSize={14} />}
        </CustomAvatar>
        <Typography variant="caption" noWrap sx={{ flex: 1, minWidth: 0 }}>
          {card.assigneeName || 'Unassigned'}
        </Typography>
        <Tooltip title={`Created ${new Date(card.createdAt).toLocaleString()}`} arrow>
          <Typography variant="caption" color="text.disabled">
            {ageLabel(card.createdAt)}
          </Typography>
        </Tooltip>
      </Box>

      <Menu
        anchorEl={menu}
        open={!!menu}
        onClose={() => setMenu(null)}
        onClick={(e) => e.stopPropagation()}
      >
        <ListSubheader sx={{ lineHeight: '32px' }}>Move to…</ListSubheader>
        {stages.map((s) => (
          <MenuItem
            key={s.id}
            disabled={s.id === card.stageId}
            onClick={() => {
              setMenu(null);
              onMoveTo(card.id, s.id);
            }}
          >
            <Box component="span" sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: s.color || 'grey.400', mr: 2 }} />
            {s.name}
          </MenuItem>
        ))}
      </Menu>
    </Card>
  );
};

export default memo(SrCardView);
