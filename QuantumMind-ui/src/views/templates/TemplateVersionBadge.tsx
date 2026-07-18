// ** MUI Imports
import Chip from '@mui/material/Chip';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

interface Props {
  version?: string;
}

const TemplateVersionBadge = ({ version }: Props) => {
  return (
    <Chip
      size="small"
      variant="outlined"
      icon={<Icon icon="bx:git-branch" fontSize={14} />}
      label={`v${version || '1.0.0'}`}
      sx={{ fontSize: 11, fontWeight: 600 }}
    />
  );
};

export default TemplateVersionBadge;
