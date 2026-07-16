import { Box } from "@mui/material";

type Props = {
  link: string;
  type: string;
};
export default function Video({ link, type }: Props) {
  return (
    <Box sx={{ mt: 1, maxWidth: "100%" }}>
      <video
        style={{ maxWidth: "95%", height: "15rem", borderRadius: "0.5rem" }}
        controls
      >
        <source src={link} type={`video/${type}`}></source>
      </video>
    </Box>
  );
}
