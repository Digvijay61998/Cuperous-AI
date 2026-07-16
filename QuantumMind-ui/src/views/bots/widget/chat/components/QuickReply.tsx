import * as React from 'react';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import { Typography } from '@mui/material';

type Props = {};
export default function ColorChips({
  isSender,
  message,
  handleButtonFunction,
  buttons,
  botStyles,
  socket,
  updatemyMessages,
}: any) {
  const handleButton = async (e: any, item: any) => {
    e.preventDefault();
    if (item.type === 'text') {
      const message = {
        value: item.value,
        type: 'text',
        senderId: 'visitor_id_1010',
        time: new Date().toISOString(),
        id: new Date().getTime(),
      };
      await socket.emit('events', {
        event: 'chat-message-bot',
        data: { message: item.value },
      });
      updatemyMessages(message);
    } else if (item.type === 'goto') {
      const message = {
        value: item.title,
        type: 'text',
        senderId: 'visitor_id_1010',
        time: new Date().toISOString(),
        id: new Date().getTime(),
      };
      await socket.emit('events', {
        event: 'chat-message-bot',
        data: { message: item.value, type: 'goto' },
      });
      updatemyMessages(message);
    }
  };
  const buttonStyle= {
    textTransform: "capitalize",
    color: botStyles?.buttonTextColor || "default",
    backgroundColor: botStyles?.buttonColor,
    "&:hover":{
      backgroundColor:"blue",
      color:"#fff"
    },
    borderColor: botStyles?.buttonColor
  }
  return (
    <div
      style={{
        marginTop: '0.3rem',
        borderRadius: '0.4rem',
        width: 'fit-content',
        minWidth: '14rem',
        maxWidth: '15rem',
        padding: '0.4rem',
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
          color: isSender ? 'common.white' : 'text.primary',
          backgroundColor: isSender
            ? botStyles?.headerBackgroundColor || 'primary.main'
            : 'background.paper',
        }}
      >
        {message}
      </Typography>
    <Stack direction="row" justifyContent="flex-start" flex={1} gap={1} marginTop={2} flexWrap="wrap" spacing={1} width="100%" >
      {
        buttons && buttons.map((item: any, index:number) =>
          <Button key={index} onClick={(e: any)=>handleButton(e, item)}  sx={{ m: 0, p: 0, borderRadius: "50%", textTransform:"capitalize" }}>
            <Chip
              label={item.title}
              color="primary"
              variant="outlined"

              sx={{ fontSize: '0.7rem', cursor: "pointer", ...buttonStyle }}
            />
          </Button>
        )
      }
    </Stack>
    </div>
  );
}
