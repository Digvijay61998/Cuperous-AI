// ** React Imports
import React from 'react';
import { useState, SyntheticEvent, useRef } from 'react';

// ** MUI Imports
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Box, { BoxProps } from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Modal from '@mui/material/Modal';
import { toast } from 'react-hot-toast';
// ** Icon Imports
import Icon from 'src/@core/components/icon';

import Axios from 'src/helper/Axios';
import env from 'src/configs/environments';
import { ChatContext } from 'src/context/SocketContext';
// ** Types

// ** Styled Components
const ChatFormWrapper = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  boxShadow: theme.shadows[1],
  padding: theme.spacing(1.25, 4),
  justifyContent: 'space-between',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
}));

const Form = styled('form')(({ theme }) => ({
  padding: theme.spacing(0, 5, 5),
}));

// const chatContext = React.useContext(ChatContext);

const SendMsgForm = (props: any) => {
  // ** Props
  const { socket, visitorAccessToken } = props;

  // ** State
  const messageRef = useRef<string>('');
  const [msg, setMsg] = useState<string>('');
  const handleSendMsg = (e: SyntheticEvent) => {
    e.preventDefault();
    const message = {
      value: msg,
      type: 'text',
      senderId: 'visitor_id_1010',
      time: new Date().toISOString(),
      id: new Date().getTime(),
    };
    // socket?.emit('events', {
    //   event: 'chat-message-bot',
    //   data: { message: message.value },
    // });
    // messageArray.push(message)

    socket.emit('events', {
      event: 'chat-message-bot',
      data: { message: message.value },
    });
    props.updatemyMessages(message);
    setMsg('');
  };

  const handleUploadImage = async (e: any) => {
    var file = e.target.files[0];
    const imageUrl = await uploadFileServer(e, file);
    console.log({ imageUrl });
    const message = {
      value: imageUrl,
      type: 'image',
      senderId: 'visitor_id_1010',
      time: new Date().toISOString(),
      id: new Date().getTime(),
    };
    socket?.emit('events', {
      event: 'chat-message-bot',
      data: { message: message.value },
    });
    // messageArray.push(message)
    props.updatemyMessages(message);
  };

  const uploadFileServer = async (e: any, file: any) => {
    if (file.size > 2240032) {
      toast.error('Try to upload less than 2MB');
      return;
    }
    try {
      let formData = new FormData();
      formData.append('file', file);
      const res: any = await Axios.post(
        '/file',

        formData,
        {
          headers: {
            Authorization: 'Bearer ' + visitorAccessToken,
          },
        },
      );

      return `${env.baseurl}/api${res.data.url}`;
    } catch (error: any) {
      toast.error(error.response.data.message || error.message || 'Failed...');
      return;
    }
  };
  return (
    <Form
      onSubmit={handleSendMsg}
      sx={{ bottom: 0, position: 'absolute', width: '100%' }}
    >
      <ChatFormWrapper>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            size="small"
            value={msg}
            placeholder="Type your message here…"
            onChange={(e) => setMsg(e.target.value)}
            sx={{
              '& .Mui-focused': { boxShadow: 0 },
              '& .MuiOutlinedInput-input': { pl: 0 },
              '& fieldset': { border: '0 !important' },
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip placement="top" title="Attachment">
            <IconButton
              size="small"
              component="label"
              htmlFor="upload-img"
              sx={{ color: 'text.primary' }}
            >
              <Icon icon="bx:paperclip" />
              <input
                hidden
                type="file"
                id="upload-img"
                onChange={(e: any) => handleUploadImage(e)}
              />
            </IconButton>
          </Tooltip>
          <IconButton type="submit">
            <Icon icon="material-symbols:send" color="blue" />
          </IconButton>
        </Box>
      </ChatFormWrapper>
    </Form>
  );
};

export default SendMsgForm;
