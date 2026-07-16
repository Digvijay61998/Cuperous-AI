import { Box } from "@mui/material";
type Props = {
  link: string;
};
export default function Audio({ link }: Props) {
  return (
    <Box sx={{mt: 2, maxWidth:"100%"}}>
      <audio
      style={{width:"90%"}}
        // controlsList="nodownload"
        controls
        src={link}
      ></audio>
    </Box>
  );
}
