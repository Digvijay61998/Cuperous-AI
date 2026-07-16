// ** React Imports
import React from 'react';

// ** MUI Imports
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';

// ** Icon Imports
import Icon from 'src/@core/components/icon';



export interface DialogTitleProps {
  id: string;
  children?: React.ReactNode;
  onClose: () => void;
}

export default function BotNodeDialogTitle(props: DialogTitleProps) {
  const { children, onClose, ...other } = props;

  return (
    <DialogTitle sx={{ m: 0, p: 4 }} {...other}>
      {children}
      {onClose ? (
        <IconButton
          aria-label="close"
          onClick={onClose}
          color='error'
          sx={{
            position: 'absolute',
            right: 45,
            top: 8,
            color: (theme) => theme.palette.error.main,
          }}
        >
          <Icon fontSize={24} icon="eva:close-fill" />
        </IconButton>
      ) : null}

    </DialogTitle>
  );
}