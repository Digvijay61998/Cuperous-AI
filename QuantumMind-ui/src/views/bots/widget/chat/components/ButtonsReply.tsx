import * as React from 'react';
import { Typography } from '@mui/material';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Box from '@mui/material/Box';

type Props = {
  isSender: boolean;
  message: string;
  handleButtonFunction: (type: string, value: string) => void;
  buttons: any;
  botStyles: any;
  socket: any;
  updatemyMessages: any;
};
export default function GroupOrientation({
  isSender,
  message,
  handleButtonFunction,
  buttons,
  botStyles,
  socket,
  updatemyMessages,
}: Props) {
  const handleButton = (e: any, value: string) => {
    e.preventDefault();
    const message = {
      value: value,
      type: 'text',
      senderId: 'visitor_id_1010',
      time: new Date().toISOString(),
      id: new Date().getTime(),
    };
    socket?.emit('events', {
      event: 'chat-message-bot',
      data: { message: message.value },
    });
    updatemyMessages(message);
  };
  const buttonStyle = {
    color: botStyles?.buttonTextColor || 'default',
    backgroundColor: botStyles?.buttonColor,
    textTransform: 'capitalize',
  };
  return (
    <div
      style={{
        border: '1px solid #00a7ff',
        marginTop: '0.3rem',
        borderRadius: '0.4rem',
        width: 'fit-content',
        minWidth: '14rem',
        maxWidth: '15rem',
      }}
    >
      <Typography
        sx={{
          width: '100%',
          fontSize: '0.875rem',
          mt: 2,
          mb: 2,
          p: (theme) => theme.spacing(0, 1),
          borderTopLeftRadius: !isSender ? 0 : undefined,
          borderTopRightRadius: isSender ? 0 : undefined,
          color: isSender ? 'common.white' : botStyles?.buttonTextColor,
          backgroundColor: isSender
            ? botStyles?.buttonColor
            : 'background.paper',
          '&.hover:': {
            background: 'text.primary',
            color: '#fff',
          },
          borderColor: botStyles?.buttonColor,
        }}
      >
        {message}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          '& > *': {
            m: 1,
          },
        }}
      >
        <ButtonGroup
          fullWidth
          orientation="vertical"
          aria-label="vertical outlined button group"
          sx={{borderColor: botStyles?.buttonColor}}
        >
          {buttons.length > 0 &&
            buttons.map((item: any, index: number) => {
              if (item?.type === 'phone') {
                return (
                  <Button
                    key={index}
                    sx={buttonStyle}
                    href={`tel:${item.value}`}
                  >
                    {item.title}
                  </Button>
                );
              } else if (item?.type === 'goto') {
                return (
                  <Button
                    sx={buttonStyle}
                    onClick={() => handleButtonFunction('goto', item.value)}
                  >
                    {item.title}
                  </Button>
                );
              } else if (item?.type === 'url') {
                return (
                  <Button
                    sx={buttonStyle}
                    href={item.value}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.title}
                  </Button>
                );
              } else if (item?.type === 'webview') {
                return (
                  <Button
                    sx={buttonStyle}
                    onClick={() => handleButtonFunction('webview', item.value)}
                  >
                    {item.title}
                  </Button>
                );
              } else if (item?.type === 'text') {
                return (
                  <Button
                    sx={buttonStyle}
                    onClick={(e: any) => handleButton(e, item.value)}
                  >
                    {item.title}
                  </Button>
                );
              } else {
                return <Button sx={buttonStyle}>{item.title}</Button>;
              }
            })}
        </ButtonGroup>
      </Box>
    </div>
  );
}
