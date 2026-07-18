// ** MUI Imports
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

interface Props {
  // 'empty' = no templates at all, 'no-results' = filters returned nothing
  variant?: 'empty' | 'no-results';
  onUpload?: () => void;
}

const TemplateEmptyState = ({ variant = 'empty', onUpload }: Props) => {
  const isNoResults = variant === 'no-results';

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
        <Icon
          icon={isNoResults ? 'bx:search-alt' : 'material-symbols-light:web-sharp'}
          fontSize={80}
        />
      </Box>
      <Typography variant="h6" sx={{ color: 'text.secondary' }}>
        {isNoResults ? 'No templates match your filters' : 'No templates yet'}
      </Typography>
      <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 420 }}>
        {isNoResults
          ? 'Try adjusting your search or filters to find what you are looking for.'
          : 'Upload your first interactive template to serve it inside WhatsApp WebView.'}
      </Typography>
      {!isNoResults && onUpload && (
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={onUpload}
          startIcon={<Icon icon="bx:upload" />}
        >
          Upload Template
        </Button>
      )}
    </Box>
  );
};

export default TemplateEmptyState;
