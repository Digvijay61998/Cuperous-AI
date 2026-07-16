import { Box } from "@mui/material";
type Props = {
  link: any;
  isSender: boolean;
};
export default function Audio({ link, isSender }: Props) {
  return (
    <Box  sx={{
  
      borderRadius: 1,
      width: '85%',
      fontSize: '0.875rem',
      m: 1  ,
      ml: isSender ? 'auto' : undefined,
    }}>
      <audio
      style={{width:"90%"}}
        // controlsList="nodownload"
        controls
        src={link}
      ></audio>
    </Box>
  );
}
