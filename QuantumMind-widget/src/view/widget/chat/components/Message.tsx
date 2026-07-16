import React from "react";
import { Typography } from "@mui/material";
type Props = {
  isSender: boolean;
  message: string;
  botStyles: any;
};

export default function Message({ isSender, message, botStyles }: Props) {
  return (
    <Typography
      sx={{
         borderRadius: "12px 14px 10px 12px",
        boxShadow: 1,
        fontFamily: "'Mulish', sans-serif",
        width: isSender ? "fit-content" : "65%",
        fontSize: "1rem",
        fontWeight: "500",
        p: (theme) => theme.spacing(1, 1),
        ml: isSender ? "auto" : undefined,
        borderTopLeftRadius: !isSender ? 0 : undefined,
        borderTopRightRadius: isSender ? 0 : undefined,
        color: isSender
          ? botStyles?.textColor || "common.white"
          : "text.primary",
        backgroundColor: isSender
          ? botStyles?.primaryColor || "primary.main"
          : "background.paper",
      }}
    >
      <div dangerouslySetInnerHTML={{ __html: message }} />
    </Typography>
  );
}
