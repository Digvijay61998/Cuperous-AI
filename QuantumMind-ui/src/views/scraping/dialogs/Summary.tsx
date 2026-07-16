import React from 'react';
import CommonDialog from 'src/components/dialogs/general-dialog';
import Button from '@mui/material/Button';
import { Divider, Typography } from '@mui/material';
type Props = {
  open: boolean;
  onClose: any;
  textArray: any;
  title: string;
};

export default function Summary({ open, onClose, textArray, title }: Props) {
  const ActionCompoent = () => {
    return (
      <div style={{ textAlign: 'center', width: '100%' }}>
        <Button
          size="small"
          onClick={onClose}
          variant="outlined"
          color="primary"
          sx={{ mr: 3 }}
        >
          Close
        </Button>
      </div>
    );
  };

  const Component = () => {
    // render textArray line by line
    return (
      <div style={{paddingTop:"1rem", }}>
        {textArray && textArray.length > 0 ? (
          textArray.map((text: string, index: number) => (
          <>
            <p style={{ margin: '0', padding: '0.1rem 0' }} key={index}>
              {text}
            </p>
            <Divider/>
          </>

          ))
        ) : (
          <Typography textAlign="center">No data found</Typography>
        )}
      </div>
    );
  };
  return (
    <CommonDialog
      title={title}
      description=""
      open={open}
      Component={Component}
      ActionComponent={ActionCompoent}
      onClose={onClose}
      dialogWidth="md"
    />
  );
}
