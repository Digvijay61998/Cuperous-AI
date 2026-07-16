import ChatContent from "./chat/ChatContent";

// ** MUI Imports
import { IconButton, Stack} from "@mui/material";

import { Icon } from "@iconify/react";
import { useEffect, useRef, useState,forwardRef } from "react";

// ** Types
// ** Hooks
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
// ** Utils Imports

type Props = {
  isChatBotOpen: boolean;
  botId: string;
  customStyle: any;
  customPosition: any;
  isBotOpen: boolean;
};
const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref,
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});
export default function Index(props: any) {
  const {
    isBotOpen,
    customStyle,
    customPosition,
    loadingBot,
    setIsBotOpen,
    botStyles,
  } = props;
  return (
    <div

    >
      {isBotOpen ? (
        <div
          style={{
            zIndex: 100,
            position: "fixed",
            boxShadow: "rgb(0 0 0 / 20%) 7px -2px 15px 3px",
            overflow: "hidden",
            margin: "0 auto",
            backgroundColor: "#fff",
            borderRadius: "2.1rem",
            height: "100vh",
            width: "100vw",
            ...customStyle,
            ...customPosition,
          
          }}
        >
          {loadingBot ? (
            <Stack
              justifyContent="center"
              alignItems="center"
              width="100%"
              height="100%"
            >
              <CircularProgress />
            </Stack>
          ) : (
            <ChatContent {...props} />
          )}
        </div>
      ) : (
        <div
          id="widget-btn-bounce-animation"
          style={{
            position: "fixed",
            bottom: 40,
            ...customPosition
          }}
          onClick={() => setIsBotOpen(true)}
        >
          {botStyles.widgetAvatar ? (
            <div style={{ cursor: "pointer" }}>
              <img
                src={botStyles.widgetAvatar}
                width="60"
                height="60"
                style={{ objectFit: "scale-down", borderRadius: "50%" }}
              />
            </div>
          ) : (<>
            <Snackbar open={true} autoHideDuration={6000}>
              <span 
              style={{
                transitionProperty: 'opacity',
                boxShadow: "rgb(0 18 46 / 18%) 0px 2px 20px 0px",
                height: '35px',
                whiteSpace: 'nowrap',
                fontSize: '17px',
                borderRadius: '16px',
                padding: '10px 15px',
                position:'relative',
                textAlign:'center',
                left:`${botStyles.widgetPosition == 'left' ? '50px':'-300px'}`
              }}
              > Hi! try advance Ai chat Bot </span>
      </Snackbar>
            <IconButton
              sx={{ p: 2, backgroundColor: "#fff", boxShadow: "0 0 5px grey" }}
              onClick={() => setIsBotOpen(true)}
            >
              <Icon
                icon={"material-symbols:chat"}
                fontSize={25}
                color="#696CFF"
              />
            </IconButton>
            </>
          )}
        </div>
      )}
    </div>
  );
}
