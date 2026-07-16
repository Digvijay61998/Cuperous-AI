import React from 'react';
import { Typography } from '@mui/material';
import Sentiment from '../sentiment-component';

type Props = {
  isSender: boolean;
  message: string;
  sentiment?: 'natural' | 'positive' | 'negative' | 'neutral' | null | undefined;

};

export default function Message({ isSender, message, sentiment }: Props) {
  return (
    <Typography
      sx={{
        boxShadow: 1,
        borderRadius: 1,
        maxWidth: '100%',
        textAlign: 'left',
        wordBreak: 'break-word',
        position: 'relative',
        minWidth: 'fit-content',
        height: 'auto',
        fontSize: '0.875rem',
        p: (theme) => theme.spacing(3, 4),
        ml: isSender ? 'auto' : undefined,
        borderTopLeftRadius: !isSender ? 0 : undefined,
        borderTopRightRadius: isSender ? 0 : undefined,
        color: isSender ? 'common.white' : 'text.primary',
        backgroundColor: isSender ? 'primary.main' : 'background.paper',
      }}
    >
      {message}
      {!isSender && sentiment &&
      <div
      // shift it to bottom right corner
      style={{position: 'absolute', top: -15, right: -15}}
      >
        <Sentiment sentiment={sentiment} />
      </div>
      
      }
    </Typography>
  );
}
