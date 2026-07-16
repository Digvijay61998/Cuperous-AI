import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import CardHeader from '@mui/material/CardHeader';

import TextField from '@mui/material/TextField';
import CardContent from '@mui/material/CardContent';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Icon from 'src/@core/components/icon';
import { CardMedia, Divider, IconButton, Typography } from '@mui/material';
import { red } from '@mui/material/colors';

interface State {
  password: string;
  showPassword: boolean;
}
type Props = {
  selectedColor: string;
};
function BotPreview(props: any) {
  const { selectedColor } = props;
  return (
    <Grid container spacing={5}>
      <Grid item xs={12}>
        <Card>
          <CardHeader
            sx={{ backgroundColor: selectedColor }}
            avatar={
              <Avatar aria-label="recipe">
                <img
                  alt="John Doe"
                  src="/images/avatars/1.png"
                  className="MuiAvatar-img css-1pqm26d-MuiAvatar-img"
                />
              </Avatar>
            }
            action={
              <IconButton aria-label="settings">
                <Icon icon="bx:dots-vertical-rounded" fontSize={20} />
              </IconButton>
            }
            title={
              <Typography variant="subtitle1" style={{ color: '#fff' }}>
                Johnny Depp
              </Typography>
            }
            subheader={
              <Typography
                variant="subtitle1"
                style={{ color: '#fff', fontSize: '12px' }}
              >
                September 14, 2016
              </Typography>
            }
          />

          <div
            className="inner-header flex"
            style={{
              background: '#00a7ff',
              color: 'white',
            }}
          >
            <Typography
              variant="subtitle1"
              style={{
                color: '#fff',
                justifyContent: 'start',
                display: 'flex',
                padding: '8px',
                alignItems: 'center',
              }}
            >
              <Icon icon="bx:dots-vertical-rounded" fontSize={20} /> We reply
              immediately
            </Typography>
          </div>
          <div
            style={{
              background: '#00a7ff',
              color: 'white',
            }}
          >
            <svg
              className="waves"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              viewBox="0 24 150 28"
              preserveAspectRatio="none"
              shape-rendering="auto"
            >
              <defs>
                <path
                  id="gentle-wave"
                  d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
                />
              </defs>
              <g className="parallax">
                <use
                  xlinkHref="#gentle-wave"
                  x="48"
                  y="0"
                  fill="rgba(255,255,255,0.7"
                />
                <use
                  xlinkHref="#gentle-wave"
                  x="48"
                  y="3"
                  fill="rgba(255,255,255,0.5)"
                />
                <use
                  xlinkHref="#gentle-wave"
                  x="48"
                  y="5"
                  fill="rgba(255,255,255,0.3)"
                />
                <use xlinkHref="#gentle-wave" x="48" y="7" fill="#fff" />
              </g>
            </svg>
          </div>

          {/* <div style={{backgroundColor: '#fff',justifyContent:'start',display: 'flex',alignItems:'center',}}>
            
            </div> */}
          <CardContent>
            <Typography
              variant="body2"
              style={{
                backgroundColor: '#ddd',
                color: '#000',
                padding: '10px',
                borderRadius: '16px',
                maxWidth: '250px',
              }}
            >
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </Typography>
            <br />
            <Typography
              variant="body2"
              sx={{
                backgroundColor: selectedColor,
                color: '#fff',
                padding: '10px',
                marginLeft: '50px',
                borderRadius: '16px',
                maxWidth: '250px',
              }}
            >
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </Typography>
            <br />
            <Typography
              variant="body2"
              style={{
                backgroundColor: '#ddd',
                color: '#000',
                padding: '10px',
                borderRadius: '16px',
                maxWidth: '250px',
              }}
            >
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </Typography>
            <br />
            {/* <Typography variant="body2" style={{backgroundColor:'#3F51B5',color:'#fff', padding: '10px',marginLeft: '50px', borderRadius: '16px', maxWidth:'250px'}}>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
                </Typography>
                <br/> */}
          </CardContent>
          <Divider />
          <div style={{ position: 'relative' }}>
            <TextField
              id="standard-basic"
              label={<Typography variant="subtitle2">Enter message</Typography>}
              fullWidth
              variant="standard"
              style={{ marginBottom: 2, marginLeft: 4 }}
            />
            <IconButton
              sx={{
                position: 'absolute',
                backgroundColor: selectedColor,
                top: 2,
                right: 16,
              }}
              aria-label="recipe"
            >
              <Icon icon="bx:send" fontSize={25} style={{ color: '#fff' }} />
            </IconButton>
          </div>
        </Card>
      </Grid>

      <Grid item xs={5}></Grid>
    </Grid>
  );
}

export default BotPreview;
