// ** MUI Imports
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import Icon from 'src/@core/components/icon';
import { earlierIncidentRows } from './earlierIncidents';

interface Props {
  earlier?: any[];
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  /** No contact linked, or the contact has no other incidents (R9.6). */
  hasContact?: boolean;
}

/**
 * Earlier incidents of the same contact (R9.4–R9.6). Read-only: each item
 * shows the summary the profile kept, never a transcript (D9) and never any
 * control that could act on the chat (R9.5).
 */
const EarlierIncidents = ({ earlier, hasMore, loadingMore, onLoadMore }: Props) => {
  const rows = earlierIncidentRows(earlier);
  return (
    <Accordion disableGutters elevation={0} sx={{ mb: 3, border: (t) => `1px solid ${t.palette.divider}` }}>
      <AccordionSummary expandIcon={<Icon icon="bx:chevron-down" />} aria-controls="earlier-incidents" id="earlier-incidents-header">
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          Earlier incidents{rows.length ? ` (${rows.length}${hasMore ? '+' : ''})` : ''}
        </Typography>
      </AccordionSummary>
      <AccordionDetails id="earlier-incidents">
        {!rows.length ? (
          <Typography variant="body2" color="text.secondary">
            No earlier incidents for this visitor.
          </Typography>
        ) : (
          rows.map((r) => (
            <Box key={r.id} sx={{ py: 2, borderBottom: (t) => `1px solid ${t.palette.divider}` }}>
              <Typography variant="caption" color="text.secondary">
                {r.openedAt} · {r.ticketRef} · {r.outcome}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {r.problem}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {r.summary}
              </Typography>
            </Box>
          ))
        )}
        {hasMore && (
          <Button size="small" sx={{ mt: 2 }} disabled={loadingMore} onClick={onLoadMore}>
            {loadingMore ? 'Loading…' : 'Load 20 more'}
          </Button>
        )}
      </AccordionDetails>
    </Accordion>
  );
};

export default EarlierIncidents;
