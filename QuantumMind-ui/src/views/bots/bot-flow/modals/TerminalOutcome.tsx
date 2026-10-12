// Settings for SUCCESS / FAILURE / TIMEOUT branch nodes (crm-incident-handover 6.6).
import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import { DialogContent, Stack, TextField, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'src/@core/components/icon';
import { AppDispatch, RootState } from 'src/store';
import { getNodeDetails, nodeUpdate } from 'src/store/apps/bot-flow';
import BotNodeDialogTitle from './common';
import TerminalToggle from '../TerminalToggle';
import { isTerminal, withTerminal } from '../terminal';

const META: Record<string, { label: string; icon: string }> = {
  SUCCESS: { label: 'SUCCESS', icon: 'akar-icons:circle-check-fill' },
  FAILURE: { label: 'FAILURE', icon: 'entypo:circle-with-cross' },
  TIMEOUT: { label: 'TIMEOUT', icon: 'mdi:timer-sand' },
};

export default function TerminalOutcome(props: any) {
  const { open, setOpen, nodeId: id, nodeType, fullScreen, handleClose, title, setTitle } = props;
  const dispatch = useDispatch<AppDispatch>();
  const nodeDetails: any = useSelector((state: RootState) => state.flow.nodeDetails);
  const [terminal, setTerminal] = useState(false);
  const meta = META[nodeType] ?? META.SUCCESS;

  useEffect(() => {
    if (id) dispatch(getNodeDetails(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (nodeDetails?.id && nodeDetails.id === id) {
      setTerminal(isTerminal(nodeDetails.payload));
      setTitle(nodeDetails?.title || '');
    }
  }, [nodeDetails, id]);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    dispatch(
      nodeUpdate({
        id,
        title,
        payload: withTerminal(nodeDetails?.id === id ? nodeDetails?.payload : {}, terminal),
      }),
    );
    setOpen(false);
  };

  return (
    <Dialog
      fullScreen={fullScreen}
      open={open}
      aria-labelledby="responsive-dialog-terminal"
      PaperProps={{ sx: { position: 'fixed', top: 10, right: 10, m: 0 } }}
    >
      <BotNodeDialogTitle id="responsive-dialog-terminal" onClose={handleClose}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Icon icon={meta.icon} fontSize={24} />
          <Stack direction="column" alignItems="flex-start">
            <Typography>{meta.label}</Typography>
            <Typography variant="caption">
              Node Id: <strong>{id}</strong>
            </Typography>
          </Stack>
        </Stack>
        <div style={{ padding: '16px 0 0 0' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type Block Title"
            inputProps={{ 'aria-label': 'Block title' }}
            value={title || ''}
            onChange={(event) => setTitle(event.target.value || '')}
          />
        </div>
      </BotNodeDialogTitle>
      <Divider style={{ margin: 0 }} />
      <DialogContent sx={{ p: 4, background: '#fff', minWidth: 350 }}>
        <IconButton
          aria-label="save"
          onClick={handleSubmit}
          sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.success.main }}
        >
          <Icon fontSize={24} icon="bi:check-lg" />
        </IconButton>
        <TerminalToggle idPrefix={`node-${id}`} checked={terminal} onChange={setTerminal} />
      </DialogContent>
    </Dialog>
  );
}
