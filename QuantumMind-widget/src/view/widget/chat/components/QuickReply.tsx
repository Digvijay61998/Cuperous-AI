import * as React from "react";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import { Divider, Typography } from "@mui/material";

type Props = {};
export default function ColorChips({
  isSender,
  message,
  buttons,
  botStyles,
  socket,
  updatemyMessages,
  visitorId,
}: any) {
  const handleButton = async (e: any, item: any) => {
    e.preventDefault();
    if (item.type === "text") {
      const message = {
        value: item.value,
        type: "text",
        senderId: visitorId,
        time: new Date().toISOString(),
        id: new Date().getTime(),
      };
      await socket.emit("events", {
        event: "chat-message-bot",
        data: { message: item.value },
      });
      updatemyMessages(message);
    } else if (item.type === "goto") {
      const message = {
        value: item.title,
        type: "text",
        senderId: visitorId,
        time: new Date().toISOString(),
        id: new Date().getTime(),
      };
      await socket.emit("events", {
        event: "chat-message-bot",
        data: { message: item.value, type: "goto" },
      });
      updatemyMessages(message);
    }
  };
  const buttonStyle = {
    textTransform: "capitalize",
    color: !isSender ? botStyles?.buttonTextColor : "default",
    backgroundColor: !isSender ? botStyles?.buttonColor : "default",
    "&:hover": {
      backgroundColor: "blue",
      color: "#fff",
    },
    borderColor: botStyles.buttonColor,
  };
  return (
    <div
      style={{
        // border: `1px solid ${botStyles.primaryColor}`,
        marginTop: "0.3rem",
        borderRadius: "0.4rem",
        width: "fit-content",
        minWidth: "90%",
        maxWidth: "15rem",
        padding: "0.2rem",
        boxShadow:
          "0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)",
      }}
    >
   {message &&   <Typography
        sx={{
          width: "fit-content",
          fontSize: "0.875rem",
          mt: 2,
          mb: 2,
          p: (theme) => theme.spacing(0, 1),
          borderTopLeftRadius: !isSender ? 0 : undefined,
          borderTopRightRadius: isSender ? 0 : undefined,
          color: isSender ? "#000" : "#000",
          backgroundColor: isSender
            ? botStyles.buttonColor
            : "background.paper",
          "&.hover:": {
            background: "text.primary",
            color: "#000",
          },
        }}
      >
        {message}
      </Typography>}
      <Divider />
      <Stack
        direction="row"
        justifyContent="center"
        flex={1}
        gap={0.4}
        marginTop={1}
        flexWrap="wrap"
        width="100%"
      >
        {buttons &&
          buttons.map((item: any, index: number) => (
            <Button
              key={index}
              onClick={(e: any) => handleButton(e, item)}
              sx={{
                m: 0,
                p: 0,
                borderRadius: "50%",
                textTransform: "capitalize",
              }}
            >
              <Chip
                label={item.title}
                color="primary"
                variant="outlined"
                sx={{ fontSize: "0.7rem", cursor: "pointer", ...buttonStyle }}
              />
            </Button>
          ))}
      </Stack>
    </div>
  );
}
