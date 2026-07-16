// ** React Imports
import { useState, SyntheticEvent } from 'react'

// ** MUI Imports
import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Box, { BoxProps } from '@mui/material/Box'
import Tooltip from "@mui/material/Tooltip"
import Modal from '@mui/material/Modal'

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Types
import { SendMsgComponentType } from 'src/types/apps/chatTypes'

// ** Styled Components
const ChatFormWrapper = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  boxShadow: theme.shadows[1],
  padding: theme.spacing(1.25, 4),
  justifyContent: 'space-between',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper
}))

const Form = styled('form')(({ theme }) => ({
  padding: theme.spacing(0, 5, 5)
}))

const SendMsgForm = (props: SendMsgComponentType) => {
  // ** Props
  const { store, dispatch, sendMsg } = props

  // ** State
  const [msg, setMsg] = useState<string>('')

  const handleSendMsg = (e: SyntheticEvent) => {
    e.preventDefault()
    if (store && store.selectedChat && msg.trim().length) {
      dispatch(sendMsg({ ...store.selectedChat, message: msg }))
    }
    setMsg('')
  }

  const [showModal, setShowModal] = useState(false);

  return (
    <Form onSubmit={handleSendMsg}>
      <ChatFormWrapper>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            value={msg}
            size='small'
            placeholder='Type your message here…'
            onChange={e => setMsg(e.target.value)}
            sx={{
              '& .Mui-focused': { boxShadow: 0 },
              '& .MuiOutlinedInput-input': { pl: 0 },
              '& fieldset': { border: '0 !important' }
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* <IconButton size='small' sx={{ color: 'text.primary' }}>
            <Icon icon='bx:microphone' />
          </IconButton> */}
          <Tooltip placement="top" title="Attachment">
            <IconButton size='small' component='label' htmlFor='upload-img' sx={{ color: 'text.primary' }}>
              <Icon icon='bx:paperclip'  />
              <input hidden type='file' id='upload-img' />
            </IconButton>
          </Tooltip>

          <Tooltip title="Feedback" placement='top'>
            <IconButton size='small' component='label' sx={{ color: 'text.primary' }}>
              <Icon icon='ooui:feedback-ltr'  />
            </IconButton>
          </Tooltip>
          <Tooltip title="Shortcuts" placement="top">
            <IconButton size='small' component='label' sx={{ mr: 4, color: 'text.primary' }}>
              <Icon icon='ic:round-shortcut' />
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

          <Button type='submit' variant='contained'>
            Send
          </Button>
        </Box>
      </ChatFormWrapper>
    </Form>
  )
}

export default SendMsgForm
