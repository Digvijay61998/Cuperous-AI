import React from 'react';
import { Typography } from '@mui/material';
type Props = {
  isSender: boolean;
  message: string;
  botStyles: any;
};

export default function Message({ isSender, message, botStyles }: Props) {
  return (
    <Typography
      sx={{
        boxShadow: 1,
        borderRadius: 1,
        width: 'fit-content',
        fontSize: '0.875rem',
        p: (theme) => theme.spacing(1, 2),
        ml: isSender ? 'auto' : undefined,
        borderTopLeftRadius: !isSender ? 0 : undefined,
        borderTopRightRadius: isSender ? 0 : undefined,
        color: isSender
          ? botStyles?.textColor || 'common.white'
          : 'text.primary',
        backgroundColor: isSender
          ? botStyles?.primaryColor || 'primary.main'
          : 'background.paper',
      }}
    >
      <div dangerouslySetInnerHTML={{ __html: message }} />
    </Typography>
  );
}
