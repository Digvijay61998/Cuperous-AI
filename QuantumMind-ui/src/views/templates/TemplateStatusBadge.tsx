// ** MUI Imports
import Chip from '@mui/material/Chip';

// ** Utils
import { humanize, statusColor } from './utils';

interface Props {
  status?: string;
  size?: 'small' | 'medium';
}

const TemplateStatusBadge = ({ status, size = 'small' }: Props) => {
  return (
    <Chip
      size={size}
      label={humanize(status) || 'Draft'}
      color={statusColor(status) as any}
      sx={{ fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}
    />
  );
};

export default TemplateStatusBadge;
