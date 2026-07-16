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
  
        borderRadius: 1,
        width: '85%',
        fontSize: '0.875rem',
        m: 1  ,
        ml: isSender ? 'auto' : undefined,
      }}
    >
      <img
        src={image}
        style={{
          objectFit:"cover",
          maxWidth: '100%',
          height:200,
          boxShadow: '0 0 5px grey',
          borderRadius: 1,
        }}
      />
    </Box>
  );
}
