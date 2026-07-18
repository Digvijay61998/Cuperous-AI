// ** MUI Imports
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

interface Props {
  open: boolean;
  onClose: () => void;
  url: string;
  name?: string;
}

// Preview a hosted template inside a mobile-sized frame to simulate the
// WhatsApp WebView experience. A "open in new tab" escape hatch is provided.
const TemplatePreviewModal = ({ open, onClose, url, name }: Props) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" scroll="body">
      <DialogContent sx={{ p: 4, position: 'relative' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
          }}
        >
          <Typography variant="h6" noWrap sx={{ maxWidth: 300 }}>
            {name || 'Template Preview'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Open in new tab" arrow>
              <IconButton
                size="small"
                onClick={() =>
                  window.open(url, '_blank', 'noopener,noreferrer')
                }
              >
                <Icon icon="bx:link-external" />
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={onClose}>
              <Icon icon="bx:x" />
            </IconButton>
          </Box>
        </Box>

        {/* Mobile frame (WhatsApp WebView simulation) */}
        <Box
          sx={{
            width: 390,
            maxWidth: '100%',
            height: '75vh',
            mx: 'auto',
            border: '10px solid #1a1a1a',
            borderRadius: 6,
            overflow: 'hidden',
            backgroundColor: '#fff',
            boxShadow: 'rgba(0, 0, 0, 0.25) 0px 14px 28px',
          }}
        >
          {url ? (
            <iframe
              src={url}
              title={name || 'template-preview'}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'text.disabled',
              }}
            >
              <Typography>No hosted build available</Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button variant="outlined" color="secondary" onClick={onClose}>
            Close
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default TemplatePreviewModal;
