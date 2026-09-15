import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

type Props = {
  isSender: boolean;
  botStyles: any;
  message: string;
  url: string;
  buttonText: string;
};

/**
 * Renders an OPEN_TEMPLATE message: the body text plus a button that opens the
 * hosted template in a new tab. Only http(s) URLs are linked — anything else
 * (javascript:, data:, ...) would be an injection vector since the URL comes
 * from bot configuration.
 */
export default function TemplateLaunch({
  isSender,
  botStyles,
  message,
  url,
  buttonText,
}: Props) {
  let safeUrl = '';
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      safeUrl = parsed.href;
    }
  } catch {
    safeUrl = '';
  }

  return (
    <Box
      sx={{
        boxShadow: 1,
        borderRadius: 1,
        maxWidth: '100%',
        width: 'fit-content',
        p: (theme) => theme.spacing(2),
        ml: isSender ? 'auto' : undefined,
        borderTopLeftRadius: !isSender ? 0 : undefined,
        borderTopRightRadius: isSender ? 0 : undefined,
        backgroundColor: 'background.paper',
      }}
    >
      {message && (
        <Typography sx={{ fontSize: '0.875rem', mb: 2, color: 'text.primary' }}>
          {message}
        </Typography>
      )}
      {safeUrl ? (
        <>
          <Button
            fullWidth
            size="small"
            variant="contained"
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              textTransform: 'none',
              backgroundColor: botStyles?.primaryColor || undefined,
              color: botStyles?.textColor || undefined,
            }}
          >
            {buttonText}
          </Button>
          <Typography
            variant="caption"
            sx={{ display: 'block', mt: 1, wordBreak: 'break-all', color: 'text.secondary' }}
          >
            {safeUrl}
          </Typography>
        </>
      ) : (
        <Typography variant="caption" color="error">
          Template link is not a valid http(s) URL.
        </Typography>
      )}
    </Box>
  );
}
