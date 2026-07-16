import React from 'react';
import CommonDialog from 'src/components/dialogs/general-dialog';
import Button from '@mui/material/Button';
type Props = {
  open: boolean;
  onClose: any;
  onConfirm: any;
  status: string;
};

export default function ChangeStatus({ open, onClose, onConfirm, status }: Props) {
  const ActionCompoent = () => {
    return (
      <div style={{textAlign:'center', width:"100%"}}>
        <Button
          size="small"
          onClick={onClose}
          variant="outlined"
          color="primary"
          sx={{mr:3}}
        >
          Cancel
        </Button>
        <Button
          size="small"
          onClick={onConfirm}
          variant="contained"
          color="warning"
        >
          Confirm
        </Button>
      </div>
    );
  };

  return (
    <CommonDialog
      title={`Are you sure to change status to ${status}`}
      description="please confirm it"
      open={open}
      Component={null}
      ActionComponent={ActionCompoent}
      onClose={onClose}
    />
  );
}
