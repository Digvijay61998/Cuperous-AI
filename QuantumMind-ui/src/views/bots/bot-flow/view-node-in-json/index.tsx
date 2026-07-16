import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'src/store';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { IconButton, Tooltip, Typography } from '@mui/material';
import IconifyIcon from 'src/@core/components/icon';
import { toast } from 'react-hot-toast';
type Props = {};

export default function ViewInJson({}: Props) {
  const { nodeDetails } = useSelector((state: RootState) => state.flow);
  const [jsonData, setJsonData] = useState<any>(null);
  const [JsonView, setJsonView] = useState<any>(null);

  useEffect(() => {
    if (nodeDetails && (nodeDetails?.id || nodeDetails?._id)) {
      setJsonData(nodeDetails);
    }
  }, [nodeDetails]);
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = async () => {
    setOpen(true);
    if (!JsonView) {
      const jsonView = await import('react-json-view');
      setJsonView(jsonView);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  // jsonData copy to clipboard function 
  // const copyToClipboard = (jsonData: any) => {
  //   if(jsonData){
  //     navigator.clipboard.writeText(JSON.stringify(jsonData));
  //     toast.success('Copied json!')
  //   }
  // };

  return (
    <>
    
       { jsonData && 
       <Tooltip arrow title='View this node in JSON form'>
        <IconButton size='small' color="primary" onClick={handleClickOpen}>
          <IconifyIcon fontSize={20} icon="material-symbols:open-in-new" />
        </IconButton>
       </Tooltip>
       }
    
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogContent>
          <DialogContentText
            id="alert-dialog-description"
            sx={{ maxHeight: '80vh', overflowY: 'auto' }}
          >
            {jsonData && JsonView && <JsonView.default src={jsonData } theme='twilight' enableClipboard={true} />}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <div style={{ textAlign: 'center', width: '100%' }}>
            <Button size="small" onClick={handleClose}>
              close
            </Button>
            {/* <Button
              size="small"
              variant="outlined"
              onClick={copyToClipboard}
              autoFocus
            >
              Copy
            </Button> */}
          </div>
        </DialogActions>
      </Dialog>
    </>
  );
}
