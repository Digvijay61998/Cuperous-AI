import { Box } from '@mui/material';

type Props = {
  link: any;
  type: string;
  isSender: boolean;
};
export default function Video({ link, type, isSender }: Props) {
  return (
    <Box   sx={{
  
      borderRadius: 1,
      width: '85%',
      fontSize: '0.875rem',
      m: 1  ,
      ml: isSender ? 'auto' : undefined,
    }}>
      <video
        style={{ maxWidth: '95%', height: '15rem', borderRadius: '0.5rem' }}
        controls
      >
        <source src={link} type={`video/${type}`}></source>
      </video>
    </Box>
  );
}
