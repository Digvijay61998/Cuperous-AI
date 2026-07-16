// ** React Imports

// ** MUI Imports
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
// ** Icon Imports
import Icon from 'src/@core/components/icon';

import { DialogContent, Stack, TextField, Typography } from '@mui/material';
import BotUserInputEditor from 'src/views/bots/bot-components/BotUserInputEditor';
import BotNodeDialogTitle from './common';
import ViewInJson from '../view-node-in-json';
type Props = {
  open: boolean;
  setOpen: any;
  nodeId: any;
  nodes: any;
  setNodes: any;
};

export default function index(props: any) {
  const {
    open,
    title,
    setTitle,
    fullScreen,
    handleClose,
  } = props;

  return (
    <div>
      <Dialog
        fullScreen={fullScreen}
        open={open}
        // onClose={handleClose}
        aria-labelledby="responsive-dialog-bot"
        PaperProps={{ sx: { position: 'fixed', top: 15, right: 15, m: 0 } }}
      >
        <BotNodeDialogTitle id="responsive-dialog-bot" onClose={handleClose}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Icon icon="bxs:user" fontSize={24} />
           <Stack direction='column' justifyContent='flex-start' alignItems='flex-start'>
           <Typography> USER INPUT <ViewInJson/> </Typography>
          <Typography variant='caption'>Node Id: <strong>{props.nodeId}</strong></Typography>
           </Stack>
          </Stack>
          <div style={{ padding: '16px 0 0 0' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Type Block Title"
              value={title || ""}
              onChange={(event) => setTitle(event.target.value || '')}
            />
          </div>
        </BotNodeDialogTitle>
        <Divider style={{ margin: 0 }} />

        <DialogContent sx={{ p: 4, background: '#fff' }}>
          <BotUserInputEditor
            {...props}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
