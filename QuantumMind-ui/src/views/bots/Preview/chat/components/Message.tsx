import React from 'react';
import { Typography } from '@mui/material';
type Props = {
  isSender: boolean;
  message: string;
  primaryColor: string;
  primaryTextColor: string;
};

export default function Message({
  isSender,
  message,
  primaryColor,
  primaryTextColor,
}: Props) {
  return (
    <Typography
      sx={{
        boxShadow: 1,
        borderRadius: 1,
        width: 'fit-content',
        fontSize: '0.875rem',
        p: (theme) => theme.spacing(3, 4),
        ml: isSender ? 'auto' : undefined,
        borderTopLeftRadius: !isSender ? 0 : undefined,
        borderTopRightRadius: isSender ? 0 : undefined,
        color: isSender ? primaryTextColor || 'common.white' : 'text.primary',
        backgroundColor: isSender
          ? primaryColor || 'primary.main'
          : 'background.paper',
      }}
    >
      {message}
    </Typography>
  );
}
