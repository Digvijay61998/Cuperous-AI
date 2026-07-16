import * as React from "react";
import { Typography } from "@mui/material";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Box from "@mui/material/Box";

type Props = {
  isSender: boolean;
  message: string;
  buttons: any;
  botStyles: any;
  socket: any;
  updatemyMessages: any;
  visitorId: string;
};
export default function GroupOrientation({
  isSender,
  message,
  buttons,
  botStyles,
  socket,
  updatemyMessages,
  visitorId,
}: Props) {
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
    color: botStyles?.buttonTextColor || "default",
    backgroundColor: botStyles?.buttonColor,
    "&:hover": {
      backgroundColor: "blue",
      color: "#fff",
    },
    borderColor: botStyles.buttonColor,
    mb: 0.5,
  };
  return (
    <div
      style={{
        // border: `1px solid ${botStyles.primaryColor}`,
        // marginTop: "0.3rem",
        borderRadius: "0.3rem",
        width: "fit-content",
        minWidth: "90%",
        maxWidth: "90%",
        boxShadow:
          "0px 2px 1px -1px rgb(0 0 0 / 20%), 0px 1px 1px 0px rgb(0 0 0 / 14%), 0px 1px 3px 0px rgb(0 0 0 / 12%)",
      }}
    >
      {message && (
        <Typography
          sx={{
            width: "fit-content",
            fontSize: "0.875rem",
            mt: 2,
            mb: 2,
            p: (theme) => theme.spacing(0, 1),
            borderTopLeftRadius: !isSender ? 0 : undefined,
            borderTopRightRadius: isSender ? 0 : undefined,
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
        </Typography>
      )}
      <Box
        sx={{
          display: "flex",
          "& > *": {
            m: 0,
          },
          width: "90%",
          margin: "0 auto",
        }}
      >
        <ButtonGroup fullWidth orientation="vertical">
          {buttons.length > 0 &&
            buttons.map((item: any, index: number) => {
              if (item?.type === "phone") {
                return (
                  <Button
                    key={index}
                    sx={buttonStyle}
                    href={`tel:${item.value}`}
                  >
                    {item.title}
                  </Button>
                );
              } else if (item?.type === "goto") {
                return (
                  <Button
                    key={index}
                    sx={buttonStyle}
                    onClick={(e: any) => handleButton(e, item)}
                  >
                    {item.title}
                  </Button>
                );
              } else if (item?.type === "url") {
                return (
                  <Button
                    sx={buttonStyle}
                    href={item.value}
                    key={index}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.title}
                  </Button>
                );
              } else if (item?.type === "text") {
                return (
                  <Button
                    key={index}
                    sx={buttonStyle}
                    onClick={(e: any) => handleButton(e, item)}
                  >
                    {item.title}
                  </Button>
                );
              }
            })}
        </ButtonGroup>
      </Box>
    </div>
  );
}
