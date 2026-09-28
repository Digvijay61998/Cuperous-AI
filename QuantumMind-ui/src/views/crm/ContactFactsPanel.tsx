// ** MUI Imports
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Custom Components
import CustomChip from 'src/@core/components/mui/chip';

// ** Store & Actions
import { useDispatch } from 'react-redux';
import { AppDispatch } from 'src/store';
import { decideFact } from 'src/store/apps/crm';

// ** Utils
import { humanize } from 'src/views/crm/utils';

interface Props {
  facts: any[];
  contactId: string;
}

const bandColor = (band: string): any => {
  switch (band) {
    case 'VERIFIED':
      return 'success';
    case 'PROBABLE':
      return 'warning';
    case 'POSSIBLE':
      return 'secondary';
    default:
      return 'default';
  }
};

const EvidenceTooltip = ({ evidence }: { evidence: any[] }) => (
  <Box sx={{ p: 1 }}>
    {(evidence || []).map((e: any, i: number) => (
      <Typography key={i} variant="caption" sx={{ display: 'block' }}>
        • {e.detail || e.kind}
      </Typography>
    ))}
    {(!evidence || evidence.length === 0) && (
      <Typography variant="caption">No evidence recorded.</Typography>
    )}
  </Box>
);

const ContactFactsPanel = ({ facts, contactId }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  const applied = (facts || []).filter((f) => f.status === 'APPLIED');
  const suggestions = (facts || []).filter((f) => f.status === 'PROPOSED');

  const handle = (factId: string, decision: 'accept' | 'dismiss') => {
    dispatch(decideFact({ factId, decision, contactId }));
  };

  if ((facts || []).length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Icon icon="bx:bot" fontSize={48} />
        <Typography variant="body2" color="text.disabled" sx={{ mt: 2 }}>
          No agent facts yet. Use Enrich to queue a research pass.
        </Typography>
      </Box>
    );
  }

  const factRow = (f: any, withActions: boolean) => (
    <Box
      key={f.id}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        py: 2,
        borderBottom: (t) => `1px solid ${t.palette.divider}`,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="caption" color="text.disabled">
            {humanize(f.field)}
          </Typography>
          <CustomChip rounded skin="light" size="small" label={f.band} color={bandColor(f.band)} />
          <Tooltip title={<EvidenceTooltip evidence={f.evidence} />} arrow placement="top">
            <Box sx={{ display: 'inline-flex', color: 'text.disabled', cursor: 'help' }}>
              <Icon icon="bx:info-circle" fontSize={16} />
            </Box>
          </Tooltip>
          {f.sourceUrl && (
            <a href={f.sourceUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex' }}>
              <Icon icon="bx:link-external" fontSize={16} />
            </a>
          )}
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
          {f.value}
        </Typography>
      </Box>
      {withActions && (
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <Button
            size="small"
            variant="contained"
            color="success"
            onClick={() => handle(f.id, 'accept')}
          >
            Accept
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => handle(f.id, 'dismiss')}
          >
            Dismiss
          </Button>
        </Box>
      )}
    </Box>
  );

  return (
    <Box>
      {suggestions.length > 0 && (
        <Box sx={{ mb: 5 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Suggestions ({suggestions.length})
          </Typography>
          {suggestions.map((f) => factRow(f, true))}
        </Box>
      )}
      {applied.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Verified facts
          </Typography>
          {applied.map((f) => factRow(f, false))}
        </Box>
      )}
      {suggestions.length === 0 && applied.length === 0 && (
        <>
          <Divider />
          <Typography variant="body2" color="text.disabled" sx={{ py: 3 }}>
            Nothing to review.
          </Typography>
        </>
      )}
    </Box>
  );
};

export default ContactFactsPanel;
