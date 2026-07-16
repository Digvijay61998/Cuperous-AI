import React from 'react';
import Icon from 'src/@core/components/icon';
import { Tooltip, IconButton } from '@mui/material';

type Props = {
  sentiment: 'natural' | 'positive' | 'negative' | 'neutral' | null | undefined;
};

export default function Sentiment({ sentiment }: Props) {
  return (
    <>
      {sentiment && (
        <Tooltip
          title={`visitor sentiment at this time is: ${sentiment}`}
          placement="top"
          arrow
        >
          <IconButton aria-label="sentiment" size="small">
            {sentiment === 'positive' ? (
              <Icon
                icon="emojione:smiling-face-with-smiling-eyes"
                fontSize="1.22rem"
                style={{
                  boxShadow: '0 0 10px #f5d76e',
                  padding: '0',
                  borderRadius: '50%',
                }}
              />
            ) : sentiment === 'negative' ? (
              <Icon
                color="red"
                icon="icon-park-solid:angry-face"
                fontSize="1.22rem"
                style={{
                  boxShadow: '0 0 10px red',
                  padding: '0',
                  borderRadius: '50%',
                }}
              />
            ) : sentiment === 'natural' || sentiment === 'neutral' ? (
              <Icon
                icon="emojione:neutral-face"
                fontSize="1.22rem"
                style={{
                  boxShadow: '0 0 10px #f5d76e',
                  padding: '0',
                  borderRadius: '50%',
                }}
              />
            ) : null}
          </IconButton>
        </Tooltip>
      )}
    </>
  );
}
