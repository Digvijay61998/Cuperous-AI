import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

type Props = {
  open: boolean;
  onClose: any;
  Component: any;
  ActionComponent: any;
  title: string;
  description: string;
  dialogWidth?: DialogProps['maxWidth'];
};
export default function CommonDialog({
  open,
  onClose,
  Component,
  ActionComponent,
  title,
  description,
  dialogWidth='xs'

}: Props) {
  const [fullWidth, setFullWidth] = React.useState(true);
  const [maxWidth, setMaxWidth] = React.useState<DialogProps['maxWidth']>(dialogWidth);

  const handleFullWidthChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setFullWidth(event.target.checked);
  };


  return (
    <>
      <Dialog
        fullWidth={fullWidth}
        maxWidth={maxWidth}
        open={open}
        onClose={onClose}
       
      >
        <DialogTitle sx={{ textAlign: 'center', mb: 0, pb: 0 }}>
          {title}
        </DialogTitle>
        <DialogContent sx={{ mt: -3, }}>
          <DialogContentText sx={{ textAlign: 'center', mt: -3 }}>
            {description}
          </DialogContentText>
         {Component && 
         <>
         <br />
          { Component()}
         </>
         }
        </DialogContent>
        <DialogActions sx={{ textAlign: 'center',}}>
         {ActionComponent && ActionComponent()}
        </DialogActions>
      </Dialog>
    </>
  );
}
