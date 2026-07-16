import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

export default function MoreOptions({anchorEl, open, handleClose, handleClearChat,handleRestartChat }: any) {



  return (
    <div>
      <Menu
        id="more-option-menu"
        anchorEl={anchorEl}
        open={open}
        MenuListProps={{
          'aria-labelledby': 'more-option-button',
        }}
        onClose={handleClose}
      >
        <MenuItem onClick={handleClearChat}>Clear Chat</MenuItem>

      </Menu>
    </div>
  );
}