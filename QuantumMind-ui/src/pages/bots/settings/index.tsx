// ** MUI Imports
import { useEffect, useState } from 'react';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

// ** Styled Component

// ** Demo Components Imports
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import BotSetting from 'src/views/bots/bot-setting';
import Link from 'next/link';
import { Button, Stack } from '@mui/material';
const FormLayouts = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [botSettingData, setBotSettingData] = useState({});
  const botSettingDetails = useSelector(
    (state: RootState) => state.bots.botSettingData,
  );
  const botId = router.query.botId;
  //Ui refresh karun line no

  // useEffect(() => {
  //   if (botId) {
  //     dispatch(getBotDataById(botId));
  //     dispatch(getUnansweredQuestions(botId));
  //   }
  // }, [botId]);
  useEffect(() => {
    if (botSettingDetails) {
      setBotSettingData(botSettingDetails);
    }
  }, [botSettingDetails]);
  const [selectedColor, setSelectedColor] = useState<string>('#3f51b5');

  return (
    <div id="bot-details" style={{ height: '100%', position: 'relative'}}>
      <Grid container spacing={6}>
        <Grid  container spacing={2}>
          <Grid
            item
            xs={7.8}
            sx={{ pt: (theme) => `${theme.spacing(8)} !important`, ml:5 }}
          >
           <Stack direction={'row'} justifyContent='space-between' alignItems='center' >
           <Typography variant="h6">Bot Details</Typography>
            <Link
              href={`/bots/bot-flow?botId=${botId}`}
              style={{ float: 'right', width: '100%' }}
            >
              <Button variant="contained" size="small">
                View Bot Flow
              </Button>
            </Link>
           </Stack>
          </Grid>
      
        </Grid>
        <Grid
          item
          xs={8}
          sx={{ pt: (theme) => `${theme.spacing(4)} !important` }}
        >
          <BotSetting />
        </Grid>

        {/* <Grid item xs={4} style={{ paddingTop: '13px' }}>
          <Preview headerBgColor={selectedColor} primaryColor={selectedColor} />
        </Grid> */}
      </Grid>
    </div>
  );
};

export default FormLayouts;
