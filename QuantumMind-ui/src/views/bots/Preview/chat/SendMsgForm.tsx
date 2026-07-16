// ** React Imports

// ** MUI Imports
import Box, { BoxProps } from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
// ** Icon Imports
import Icon from 'src/@core/components/icon';

// ** Types

// ** Styled Components
const ChatFormWrapper = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  boxShadow: '0 0 2px lightgrey',
  padding: theme.spacing(1.25, 1),
  justifyContent: 'space-between',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: theme.palette.background.paper,
}));

const Form = styled('form')(({ theme }) => ({
  padding: theme.spacing(0, 1, 1),
}));

// const chatContext = React.useContext(ChatContext);

const SendMsgForm = (props: any) => {
  // ** Props

  // ** State

  return (
    <Form sx={{ bottom: 0, position: 'absolute', width: '100%' }}>
      <ChatFormWrapper>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type your message here…"
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
              <input hidden type="file" id="upload-img" />
            </IconButton>
          </Tooltip>
          <IconButton>
            <Icon icon="material-symbols:send" color={props.primaryColor} />
          </IconButton>
        </Box>
      </ChatFormWrapper>
    </Form>
  );
};

export default SendMsgForm;
