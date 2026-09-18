// ** MUI Imports
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

interface Props {
  icon?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const CrmEmptyState = ({
  icon = 'bx:folder-open',
  title,
  subtitle,
  actionLabel,
  onAction,
}: Props) => {
  return (
    <Box
      sx={{
        width: '100%',
        py: 12,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        textAlign: 'center',
      }}
    >
      <Box sx={{ color: 'text.disabled', '& svg': { mb: 1 } }}>
        <Icon icon={icon} fontSize={80} />
      </Box>
      <Typography variant="h6" sx={{ color: 'text.secondary' }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 460 }}>
          {subtitle}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={onAction}
          startIcon={<Icon icon="bx:plus" />}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export default CrmEmptyState;
