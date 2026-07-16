import React from 'react';
import { Typography, Box } from '@mui/material';

type Props = {
  isSender: boolean;
  image: string;
};

export default function Image({ isSender, image }: Props) {
  return (
    <Box
      sx={{
        boxShadow: 1,
        borderRadius: 1,
        width: '65%',
        fontSize: '0.875rem',
        m: 1  ,
        ml: isSender ? 'auto' : undefined,
      }}
    >
      <img
        src={image}
        style={{
          objectFit: 'fill',
          maxWidth: '100%',
          maxHeight: '100%',
          boxShadow: '0 0 5px grey',
          borderRadius: 1,
        }}
      />
    </Box>
  );
}
