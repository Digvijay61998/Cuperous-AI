import React from "react";

type Props = {};

export default function ChatbotImage({}: Props) {
  return (
    <div style={{marginTop:"10rem"}}>
      <img
        src="/widget-robot.png"
        width="50%"
        height="220px"
        style={{ objectFit: "fill", opacity: "0.9" }}
      />
      <br />
      <br />
    </div>
  );
}
