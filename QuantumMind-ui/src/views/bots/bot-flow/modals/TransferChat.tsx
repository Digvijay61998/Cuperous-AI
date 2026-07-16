// ** React Imports

// ** MUI Imports
import Dialog from '@mui/material/Dialog';

import Divider from '@mui/material/Divider';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

import { DialogContent, Stack, TextField, Typography } from '@mui/material';
import TransferChat from '../../bot-components/TransferChat';
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
    setOpen,
    nodeId,
    nodes,
    setNodes,
    fullScreen,
    handleClose,
    title,
    setTitle,
  } = props;
  return (
    <div>
      <Dialog
        fullScreen={fullScreen}
        open={open}
        // onClose={handleClose}
        aria-labelledby="responsive-dialog-bot"
        PaperProps={{ sx: { position: 'fixed', top: 10, right: 10, m: 0 } }}
      >
        <BotNodeDialogTitle id="responsive-dialog-bot" onClose={handleClose}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Icon icon="bx:transfer" fontSize={24} />
            <Stack direction='column' justifyContent='flex-start' alignItems='flex-start'>
            <Typography>TRANSFER CHAT <ViewInJson/> </Typography>
         
         <Typography variant='caption'>Node Id: <strong>{props?.nodeId}</strong></Typography>
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
          <TransferChat
            {...props}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
