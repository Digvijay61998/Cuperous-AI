import React from 'react';
import CommonDialog from 'src/components/dialogs/general-dialog';
import Button from '@mui/material/Button';
type Props = {
  open: boolean;
  onClose: any;
  onConfirm: any;
};

export default function DeleteDialog({ open, onClose, onConfirm }: Props) {
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
          color="error"
        >
          Confirm
        </Button>
      </div>
    );
  };

  return (
    <CommonDialog
      title="Are you sure to delete this scraper"
      description="Once delete it will take time and you can not revert it, please confirm it"
      open={open}
      Component={null}
      ActionComponent={ActionCompoent}
      onClose={onClose}
    />
  );
}
