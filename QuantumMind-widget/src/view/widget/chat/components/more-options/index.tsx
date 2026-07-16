import * as React from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import SwitchButton from "./Switch";

export default function MoreOptions(props: any) {
  const {anchorEl,
    open,
    handleClose,
    handleClearChat,
    handleCloseChat,
    handleOpenSendTranscriptDialog,
    isShow,
    messageArray,} = props;
  return (
    <div>
      <Menu
        id="more-option-menu"
        anchorEl={anchorEl}
        open={open}
        MenuListProps={{
          "aria-labelledby": "more-option-button",
        }}
        onClose={handleClose}
      >
        <MenuItem onClick={handleClearChat}>Clear Messages</MenuItem>
        <MenuItem onClick={handleCloseChat}>Close Conversation</MenuItem>
    
        {isShow.isShowChats &&
          !isShow.isShowForm &&
          messageArray.length > 0 && (
            <MenuItem onClick={handleOpenSendTranscriptDialog}>
              Send Transcript
            </MenuItem>
          )}
              <MenuItem >
          {/* add toggle button */}
          <SwitchButton {...props}/>
        </MenuItem>
      </Menu>
    </div>
  );
}
