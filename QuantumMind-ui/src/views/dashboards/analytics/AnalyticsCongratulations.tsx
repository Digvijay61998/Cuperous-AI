import { useState } from 'react';
// ** MUI Imports
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import Grid, { GridProps } from '@mui/material/Grid';
import { styled, useTheme } from '@mui/material/styles';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import { Stack } from '@mui/material';
import Icon from 'src/@core/components/icon';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { getWorkedSummary } from 'src/store/apps/dashboard';
// Styled Grid component
const StyledGrid = styled(Grid)<GridProps>(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    order: -1,
    display: 'flex',
    justifyContent: 'center',
  },
}));

// Styled component for the image
const Img = styled('img')(({ theme }) => ({
  right: 60,
  bottom: -1,
  height: 170,
  position: 'absolute',
  [theme.breakpoints.down('sm')]: {
    position: 'static',
  },
}));

const AnalyticsCongratulations = () => {
  // ** Hook
  const theme = useTheme();
  const { userData } = useSelector((state: RootState) => state.user);
  const { workedSummary } = useSelector((state: RootState) => state.dashboard);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [data, setData] = useState<any>({});
  useEffect(() => {
    if (workedSummary) setData(workedSummary);
  }, [workedSummary]);
  useEffect(() => {
    if (dispatch) dispatch(getWorkedSummary());
  }, [dispatch]);

  return (
    <Card sx={{ position: 'relative' ,boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'}} >
      <CardContent sx={{ py: (theme) => `${theme.spacing(5)} !important` }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={7} sx={{ textAlign: ['center', 'start'] }}>
            <Typography variant="h5" sx={{ mb: 4, color: 'primary.main' }}>
              Congratulations {userData?.fullName}! 🎉
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize:'0.8rem' }}>
              You have handled {data?.visitorCount} number of visitors in 
             <span> </span> { data?.days} days. Total Service requests you have handled are {data?.requestHandled}.{' '}
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={12} md={12} sm={12}>
                <Button
                  onClick={() => router.replace('/service-request/list')}
                  size="small"
                  variant="outlined"
                  startIcon={<Icon icon="mdi:frequently-asked-questions" />}
                  sx={{ mb: 2, textTransform: 'capitalize', fontSize:'12px', color : "#1648DE", border : "1px solid #1648DE" }}
                >
                  Respond Requests
                </Button>
                <span style={{ marginRight: '0.3rem' }}></span>
                <Button
                  // go to active conversation
                  onClick={() => router.replace('/apps/chat/active')}
                  size="small"
                  variant="outlined"
                  startIcon={<Icon icon="ph:chats-bold" />}
                  sx={{ mb: 2, textTransform: 'capitalize', fontSize:'12px', backgroundColor : "#1648DE", color : "white" }}
                >
                  Active Conversations
                </Button>
              </Grid>
            </Grid>
          </Grid>
          <StyledGrid item xs={12} sm={5}>
            <Img
              alt="Congratulations John"
              // src={`/images/cards/illustration-john-${theme.palette.mode}.png`}
              src={`/images/pages/DASHBOARD_CALLER.png`}
            />
          </StyledGrid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default AnalyticsCongratulations;
