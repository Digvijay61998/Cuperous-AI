import React from 'react';
import Alert from '@mui/material/Alert';
import Rating from '@mui/material/Rating';
import Divider from '@mui/material/Divider';
import { Stack, Box, Typography } from '@mui/material';
type Props = {
  rating: number;
  message: string;
};

export default function Feedback({ rating, message }: Props) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        p: 1,
    
        height: 200,
      }}
    >
     
      <Stack direction="row">
        <Typography
          display="block"
          sx={{ fontWeight: 'bold', mr: 2, width: 75 }}
        >
          Rating:{' '}
        </Typography>
        <Rating value={rating} readOnly />
      </Stack>
      <Stack direction="row" alignItems="center" sx={{ pt: 1 }}>
        <Typography display="block" sx={{ fontWeight: 'bold', mr: 2 }}>
          Feedback:{' '}
        </Typography>

        <Typography
          variant="overline"
          display="inline-block"
          sx={{
            fontWeight: 'bold',
            lineHeight: '14px',
            fontSize: '12px',
            textTransform: 'unset',
          }}
        >
          {message}
        </Typography>
      </Stack>
    </Box>
  );
}
