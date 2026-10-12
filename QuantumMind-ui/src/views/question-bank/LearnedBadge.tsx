import Link from 'next/link';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Icon from 'src/@core/components/icon';
import { learnedInfo } from './learned';

/**
 * "Learned from incident" label for a Question Bank entry (crm-incident-handover
 * R21.4), with links to the source incidents' service requests and the
 * knowledge-base sync state (R12.8). Renders nothing for human-written entries.
 */
const LearnedBadge = ({ item, detailed = false }: { item: any; detailed?: boolean }) => {
  const info = learnedInfo(item);
  if (!info) return null;
  return (
    <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', ml: 1 }}>
      <Chip
        size="small"
        color="info"
        variant="outlined"
        icon={<Icon icon="mdi:school-outline" fontSize={16} />}
        label="Learned from incident"
      />
      {info.sync && (
        <Tooltip title={info.sync.detail || ''} placement="top" arrow>
          <Chip size="small" color={info.sync.color} label={info.sync.label} />
        </Tooltip>
      )}
      {detailed && info.incidents.length > 0 && (
        <Typography variant="body2" component="span">
          Source:{' '}
          {info.incidents.map((i, n) => (
            <span key={`${i.label}${n}`}>
              {n > 0 ? ', ' : ''}
              {i.href ? (
                <Link href={i.href} passHref>
                  <a onClick={(e) => e.stopPropagation()}>{i.label}</a>
                </Link>
              ) : (
                i.label
              )}
            </span>
          ))}
        </Typography>
      )}
    </Box>
  );
};

export default LearnedBadge;
