// ** React Imports
import { SyntheticEvent, useState } from 'react';

// ** MUI Imports
import Box, { BoxProps } from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';

// ** Icon Imports
import Icon from 'src/@core/components/icon';
import { LoadingButton } from '@mui/lab';
// ** Types
import { SendMsgComponentType } from 'src/types/apps/chatTypes';
import { updateConversationChats } from 'src/store/apps/conversation';
import { toast } from 'react-hot-toast';
import Axios from 'src/helper/Axios';
import env from 'src/configs/environments';
import CommonDialog from 'src/components/dialogs/general-dialog';
import formatRelativeWithOptions from 'date-fns/esm/fp/formatRelativeWithOptions/index.js';
type AcceptedFileTypes = 'image' | 'audio' | 'video';
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

const SendMsgForm = (props: any) => {
  // ** Props
  const { store, dispatch, sendMsg, socket, visitorId, activeChatId } = props;
  // ** State
  const [msg, setMsg] = useState<string>('');

  // const handleSendMsg = (e: SyntheticEvent) => {
  //   e.preventDefault()
  //   if (store && store.selectedChat && msg.trim().length) {
  //     dispatch(sendMsg({ ...store.selectedChat, message: msg }))
  //   }
  //   setMsg('')
  // }

  const handleSendMsg = (e: SyntheticEvent) => {
    e.preventDefault();
    const message = {
      message: msg,
      type: 'text',
      sender: 'agent',
      time: new Date().toISOString(),
      id: new Date().getTime(),
    };
    socket.sendMessage('events', {
      event: 'chat-message-from-agent',
      data: {
        message: message.message,
        to: visitorId,
      },
    });

    dispatch(
      updateConversationChats({
        conversationId: activeChatId,
        message,
      }),
    );

    setMsg('');
  };

  const getFileType = (file: File): AcceptedFileTypes => {
    if (file?.type?.indexOf('video') !== -1) {
      return 'video';
    } else if (file?.type?.indexOf('audio') !== -1) {
      return 'audio';
    } else if (file?.type?.indexOf('image') !== -1) {
      return 'image';
    }

    toast.error('Unexpected file type');
    throw new Error('Unexpected file type.');
  };
  const uploadFileServer = async (e: any, file: any, type: string) => {
    if (type === 'video' && file?.size > 4240032) {
      toast.error('Try to upload video less than 4MB');
      return;
    } else if (file?.size > 2240032) {
      toast.error('Try to upload less than 2MB');
      return;
    }
    try {
      let formData = new FormData();
      formData.append('file', file);
      const res: any = await Axios.post('/file', formData);
      return res.data.url;
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || error?.message || 'Failed...',
      );
      return;
    }
  };

  const handleUploadDoc = async (e: any) => {
    var file = e.target.files[0];
   if(file){ var fileType = getFileType(file);
    const valueUrl = await uploadFileServer(e, file, fileType);
    const message = {
      message: `${env.baseurl}/api${valueUrl}`,
      type: fileType,
      sender: 'agent',
      time: new Date().toISOString(),
      id: new Date().getTime(),
    };

  socket.sendMessage('events', {
      event: 'chat-message-from-agent',
      data:{
        message: message.message,
        to: visitorId,
        type: message.type,
      },
    });
    
    dispatch(
      updateConversationChats({
        conversationId: activeChatId,
        message,
      }),
    );
    // setMsg('');
  }
  };

  const [showModal, setShowModal] = useState(false);
const [feedBackConfirmDialog, setFeedBackConfirmDialog] = useState<boolean>(false)

const [loading, setLoading] = useState(false);
const handleCloseFeedbackDialog = () => { setFeedBackConfirmDialog(false) }

const handleAskFeedback = async () => {
  setLoading(true);
 socket.publish({
  data:{
    type:"feedback",
    visitorId: visitorId
  }
 })
  setLoading(false)
  setFeedBackConfirmDialog(false)
};
const ActionComponent = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        mt: -2,
        width: '100%',
      }}
    >
      <Button
        variant="outlined"
        size="small"
        onClick={handleCloseFeedbackDialog}
        color="primary"
        sx={{ mr: 2 }}
      >
        Cancel
      </Button>
      <LoadingButton
        loading={loading}
        variant="contained"
        size="small"
        onClick={handleAskFeedback}
        color="primary"
      >
        Confirm
      </LoadingButton>
    </Box>
  );
};
  const closeFeedBackConfirmDialog = () => {
    setFeedBackConfirmDialog(false);
  };

  const [adsDialog, setAdsDialog] = useState<boolean>(false)
  const closeAdsDialog = () => {
    setAdsDialog(false);
  };
  const handleSendAds =  () => {
      socket.publish({
        data:{
          type: 'ads' ,
          visitorId: visitorId,
        }
      })
      setAdsDialog(false);
  }
  const AdsActionComponent = () => {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: -2,
          width: '100%',
        }}
      >
        <Button
          variant="outlined"
          size="small"
          onClick={closeAdsDialog}
          color="primary"
          sx={{ mr: 2 }}
        >
          Cancel
        </Button>
        <LoadingButton
          loading={loading}
          variant="contained"
          size="small"
          onClick={handleSendAds}
          color="primary"
        >
          Confirm
        </LoadingButton>
      </Box>
    );
  };

  const [offerDialog, setOfferDialog] = useState<boolean>(false)
  const closeOfferDialog = () => {
    setOfferDialog(false);
  };
  const handleSendOffer =  () => {  
      socket.publish({
        data:{
          type: 'offer' ,
          visitorId: visitorId,
        }
      })
      setOfferDialog(false);
  }
  const OfferActionComponent = () => {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: -2,
          width: '100%',
        }}
      >
        <Button
          variant="outlined"
          size="small"
          onClick={closeOfferDialog}
          color="primary"
          sx={{ mr: 2 }}
        >
          Cancel
        </Button>
        <LoadingButton
          loading={loading}
          variant="contained"
          size="small"
          onClick={handleSendOffer}
          color="primary"
        >
          Confirm
        </LoadingButton>
      </Box>
    );
  };
    return (
    <Form onSubmit={handleSendMsg}>
      <ChatFormWrapper>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            value={msg}
            size="small"
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
          {/* <IconButton size='small' sx={{ color: 'text.primary' }}>
            <Icon icon='bx:microphone' />
          </IconButton> */}
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
                accept="image/*, audio/*, video/*"
                onChange={(e: any) => handleUploadDoc(e)}
              />
            </IconButton>
          </Tooltip>

          <Tooltip title="Send advertisements to visitor" placement="top">
            <IconButton
              onClick={()=>setAdsDialog(true)}
              size="small"
              component="label"
              sx={{ color: 'text.primary' }}
            >
              <Icon icon="ri:advertisement-fill" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Send offers to visitor" placement="top">
            <IconButton
              onClick={()=>setOfferDialog(true)}
              size="small"
              component="label"
              sx={{ color: 'text.primary' }}
            >
              <Icon icon="bxs:offer" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Feedback" placement="top">
            <IconButton
            onClick={()=>setFeedBackConfirmDialog(true)}
              size="small"
              component="label"
              sx={{ color: 'text.primary' }}
            >
              <Icon icon="ooui:feedback-ltr" />
            </IconButton>
          </Tooltip>
          {/* <Modal
  open={showModal}
  onClose={() => setShowModal(false)}
  aria-labelledby="modal-title" aria-describedby="modal-description"
>
  <Box>
    <h2>comment</h2>
  </Box>
</Modal> */}

         <Tooltip title="Send message" placement="top">
         <IconButton
            size="small"
            type="submit"
            color="primary"
            sx={{ mr: 4, color: 'text.primary' }}
            onClick={() => setShowModal(true)}
          >
            <Icon icon="material-symbols:send-rounded" color='text.primary'/>
          </IconButton>
          </Tooltip>

          {/* <Button type="submit" variant="contained">
            Send
          </Button> */}
        </Box>
        <CommonDialog
          title={'Ask For Feedback'}
          description={'Are you sure you want to ask for feedback?'}
          open={feedBackConfirmDialog}
          onClose={closeFeedBackConfirmDialog}
          Component={null}
          ActionComponent={ActionComponent}
        />
        <CommonDialog
          title={'Send Ads'}
          description={'Are you sure you want to send ads?'}
          open={adsDialog}
          onClose={closeAdsDialog}
          Component={null}
          ActionComponent={AdsActionComponent}
        />
        <CommonDialog
          title={'Send Offer'}
          description={'Are you sure you want to send offer?'}
          open={offerDialog}
          onClose={closeOfferDialog}
          Component={null}
          ActionComponent={OfferActionComponent}
        />
      </ChatFormWrapper>
    </Form>
  );
};

export default SendMsgForm;
