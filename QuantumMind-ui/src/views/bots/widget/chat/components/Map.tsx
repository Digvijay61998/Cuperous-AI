import React from "react";
import { Stack, Typography } from "@mui/material";
type Props = {
  location: any;
};

export default function Map({ location }: Props) {
  return (
    <Stack width="100%" padding="0.5rem 0">
      <Stack
        direction="column"
        justifyContent="flex-start"
        alignItems="center"
        width="95%"
        padding="0.5rem"
        sx={{
          boxShadow: "0 0 3px grey",
          borderRadius: 1,
        }}
      >
        <iframe
          id="map"
          src={`https://maps.google.com/maps?q=${location?.latitude},${location?.longitude}&z=16&output=embed`}
          width="98%"
          height="200"
          allowFullScreen
          title="map"
        ></iframe>
        <Typography
          variant="button"
          display="block"
          gutterBottom
          sx={{
            textAlign: "center",
            width: "94%",
            textTransform: "capitalize",
            backgroundColor: "#9f99f978",
            padding: "0.5rem",
            borderBottomRightRadius: "0.5rem",
            borderBottomLeftRadius: "0.5rem",
          }}
        >
          <a
            href={`https://maps.google.com/maps?q=${location?.latitude},${location?.longitude}&z=16`}
            target="_blank"
          >
            Visit us
          </a>
        </Typography>
      </Stack>
    </Stack>
  );
}
