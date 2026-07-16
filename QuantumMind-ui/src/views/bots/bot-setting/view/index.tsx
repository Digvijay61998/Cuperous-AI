// ** React Imports
import {
  ChangeEvent,
  forwardRef,
  MouseEvent,
  SyntheticEvent,
  useEffect,
  useState,
} from 'react';

// ** MUI Imports
import Tooltip from '@mui/material/Tooltip';
import Icon from 'src/@core/components/icon';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TabContext from '@mui/lab/TabContext';
import TextField from '@mui/material/TextField';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { alpha, styled } from '@mui/material/styles';
import { pink } from '@mui/material/colors';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormControl from '@mui/material/FormControl';
import { RootState, AppDispatch } from 'src/store';
import env from 'src/configs/environments';

import Stack from '@mui/material/Stack';

import { gettag } from 'src/store/apps/tags';
import { fetchAgentList } from 'src/store/apps/agent';

const GreenSwitch = styled(Switch)(({ theme }) => ({
  '& .MuiSwitch-switchBase.Mui-checked': {
    color: pink[600],
    '&:hover': {
      backgroundColor: alpha(pink[600], theme.palette.action.hoverOpacity),
    },
  },
  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
    backgroundColor: pink[600],
  },
}));

const label = { inputProps: { 'aria-label': 'Color switch demo' } };

// ** Types
import { DateType } from 'src/types/forms/reactDatepickerTypes';
import ColorSchemeConfig from 'src/views/bots/bot-setting/color-scheme-config';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import { UpdateBotSettingData, UpdateBotStyleData } from 'src/store/apps/bots';
import { Typography } from '@mui/material';
import { useSelector } from 'react-redux';
interface State {
  password: string;
  password2: string;
  showPassword: boolean;
  showPassword2: boolean;
}

const CustomInput = forwardRef((props, ref) => {
  return (
    <TextField
      fullWidth
      {...props}
      inputRef={ref}
      label="Birth Date"
      autoComplete="off"
    />
  );
});

const BotSetting = () => {
  const [router, setRouter] = useState<any>(null);

  // ** States
  const [value, setValue] = useState<string>('general');
  const [language, setLanguage] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [agents, setAgents] = useState<string[]>([]);
  const dispatch = useDispatch<AppDispatch>();
  const [selectedColor, setSelectedColor] = useState<string>('#3f51b5');
  const botSettingDetails = useSelector(
    (state: any) => state.bots.botSettingData,
  );

  const botStyleDetails = useSelector(
    (state: any) => state?.bots?.botSettingData?.botStyles,
  );

  const botSettingDATADetails = useSelector(
    (state: any) => state?.bots?.botSettingData?.botSetting,
  );

  const handleTabsChange = (event: SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const handleBotConfigColor = (color: string) => {
    setSelectedColor(color);
  };

  // Handle Select
  const handleSelectChange = (event: SelectChangeEvent<string[]>) => {
    setLanguage(event.target.value as string[]);
  };

  const handleChangeTags = (event: SelectChangeEvent<typeof tags>) => {
    const {
      target: { value },
    } = event;
    setTags(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value,
    );
  };
  const handleChangeAgents = (event: SelectChangeEvent<typeof agents>) => {
    const {
      target: { value },
    } = event;
    setAgents(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  //Style/Design Data

  const [avtarIcon, setAvtarIcon] = useState('');
  const [borderRadius, setBorderRadius] = useState('');
  const [footerText, setFooterText] = useState('');
  const [textColor, setTextColor] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [headerTextColor, setHeaderTextColor] = useState('');
  const [headerBackgroundColor, setHeaderBackgroundColor] = useState('');
  const [buttonColor, setButtonColor] = useState('');
  const [buttonTextColor, setButtonTextColor] = useState('');
  const { botId } = useRouter().query;
  //Setting Data

  const [domains, setDomains] = useState<any>([]);
  const [welcomeMessages, setWelcomeMessages] = useState('');
  const [blockedContent, setBlockedContent] = useState<any>([]);
  const [blockedCountries, setBlockedCountries] = useState<any>([]);
  const [fallbackMessage, setFallbackMessage] = useState('');
  const [askForFeedback, setAskForFeedback] = useState<boolean>(true);
  const [getVisitorInfo, setGetVisitorInfo] = useState<boolean>(true);
  const [typingIndicator, setTypingIndicator] = useState<boolean>(true);
  const [storeVisitorInfoInCookies, setStoreVisitorInfoInCookies] =
    useState<boolean>(true);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (value === 'setting') {

      let data = {
        botId: localStorage.getItem('botID'),
        domains: domains,
        welcomeMessages: welcomeMessages,
        blockedContent: blockedContent,
        blockedCountries: blockedCountries,
        askForFeedback: askForFeedback,
        getVisitorInfo: getVisitorInfo,
        typingIndicator: typingIndicator,
        storeVisitorInfoInCookies: storeVisitorInfoInCookies,
        fallbackMessage: fallbackMessage,
      };
      dispatch(UpdateBotSettingData(data));
    }

    if (value === 'design') {

      let data = {
        botId: localStorage.getItem('botID'),
        textColor: textColor,
        primaryColor: primaryColor,
        secondaryColor: secondaryColor,
        avatar: avtarIcon,
        headerTextColor: headerTextColor,
        headerBackgroundColor: headerBackgroundColor,
        buttonColor: buttonColor,
        buttonTextColor: buttonTextColor,
      };
      dispatch(UpdateBotStyleData(data));
    }
  };

  const storeTag = useSelector((state: RootState) => state.tags.list);

  const storeAgent = useSelector(
    (state: RootState) => state.agent.agentListData.data,
  );

  useEffect(() => {
    dispatch(gettag());
    dispatch(fetchAgentList());
  }, [dispatch]);

  const overlayStyle = {
    opacity: 0.5,
  };
  const getDynamicScript = () => {
    return `<!-- Start of  Engage Bot code -->
    <script type='module'>
    window.botId =  "${botId}";
    window.baseUrl = "${env.baseurl}";
    window.isOpenChat = false;
    import engage from "${env.baseurl}/api/file/plugin.js";
    engage();
  </script>
    <!-- End of Engage Bot code -->
`;
  };
  return (
    <Card>
      <TabContext value={value}>
        <TabList
          variant="scrollable"
          scrollButtons={false}
          onChange={handleTabsChange}
          sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
        >
          <Tab value="general" label="General" />
          <Tab value="design" label="Design" />
          <Tab value="setting" label="Settings" />
          <Tab
            value="installation-instuction"
            label="Installation & instuction"
          />
        </TabList>
        <form onSubmit={(e) => handleSubmit(e)}>
          <CardContent>
            <TabPanel
              value="general"
              sx={{
                p: 0,
                border: 0,
                boxShadow: 0,
                backgroundColor: 'transparent',
              }}
            >
              <Grid container spacing={5}>
                <Grid item xs={12} sm={12}>
                  <TextField
                    size="small"
                    value={botSettingDetails?.name}
                    fullWidth
                    label="Bot Name"
                    placeholder="Bot Name"
                    disabled
                  />
                </Grid>
              </Grid>
              <br />
              <Grid container spacing={5}>
                <Grid item xs={12}>
                  <FormControl fullWidth size='small'>
                    <InputLabel
                      id="demo-simple-select-label"
                      style={{ marginTop: '-6px' }}
                    >
                      Tags
                    </InputLabel>
                    <Select
                      size="small"
                      fullWidth
                      
                      multiple
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      onChange={handleChangeTags}
                      //value={tags}
                      value={botSettingDetails?.tags || tags}
                      label="Tags"
                    >
                      {storeTag && storeTag.length > 0 &&
                        storeTag.map((item: any, index: number) => (
                          <MenuItem value={item._id}>{item.name}</MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <br />
              <Grid container spacing={5}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel
                      id="demo-simple-select-label"
                      style={{ marginTop: '-6px' }}
                    >
                      Agents
                    </InputLabel>
                    <Select
                      size="small"
                      fullWidth
                      multiple
                      disabled
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      //value={agents}
                      value={botSettingDetails?.agents || agents}
                      onChange={handleChangeAgents}
                      label="Tags"
                    >
                      {storeAgent.length > 0 &&
                        storeAgent.map((item: any, index: number) => (
                          <MenuItem value={item._id}>{item.name}</MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* <br />
                            <Grid container spacing={5}>
                                <Grid item xs={12} sm={3}>
                                    <span>URL</span>
                                </Grid>
                                <Grid item xs={12} sm={9}>
                                    <TextField size="small" fullWidth label='URL' placeholder='URL' />
                                </Grid>

                            </Grid> */}
              <br />
              <Grid container spacing={5}>
                <Grid item xs={12}>
                  <ColorSchemeConfig
                    handleBotConfigColor={handleBotConfigColor}
                  />
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel
              value="design"
              sx={{
                p: 0,
                border: 0,
                boxShadow: 0,
                backgroundColor: 'transparent',
              }}
            >
              <Grid container spacing={5}>
                <Grid item xs={12} sm={2}>
                  <span>Avatar</span>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    {/* <Button variant="contained" component="label">
                                            Upload
                                            <input hidden accept="image/*" type="file" onChange={(e) => setAvtarIcon(e.target.value)}
                                            />
                                        </Button> */}
                    <Typography
                      component="h5"
                      variant="subtitle1"
                      color="primary"
                    >
                      {avtarIcon}
                    </Typography>
                  </Stack>
                </Grid>

                {/* <Grid item xs={12} sm={2}>
                                    <span>Button Icon</span>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <Button variant="contained" component="label">
                                            Upload
                                            <input hidden accept="image/*"  type="file" onChange={(e) => setButtonIcon(e.target.value)}/>
                                        </Button>
                                        <Typography component="h5" variant="subtitle1" color="primary">{buttonIcon}</Typography>
                                    </Stack>
                                </Grid> */}
              </Grid>
              {/* <br />

                            <Grid container spacing={5}>
                                
                                <Grid item xs={12} sm={12}>
                                    <TextField size="small" fullWidth label='Border Radius' placeholder='Border Radius'
                                    defaultValue={botStyleDetails?.secondaryColor || secondaryColor}
                                    onChange={(e) => setBorderRadius(e.target.value)} />
                                </Grid>

                            </Grid>
                            <br />

                            <Grid container spacing={5}>
                                
                                <Grid item xs={12} sm={12}>
                                    <TextField size="small" fullWidth label='Footer Text' placeholder='Footer Text' 
                                    onChange={(e) => setFooterText(e.target.value)}/>
                                </Grid>

                            </Grid> */}

              <br />

              {/* <Grid container spacing={5}>
                                
                                <Grid item xs={12} sm={12}>
                                
                                    <TextField size="small" fullWidth select
                                    label='Position'
                                    defaultValue=''
                                    id='form-layouts-collapsible-select'
                                    onChange={(e) => setPosition(e.target.value)}
                                    >
                                    <MenuItem value='Right'>Right</MenuItem>
                                    <MenuItem value='Left'>Left</MenuItem>
                                    
                                    </TextField>
                                </Grid>

                            </Grid> */}

              <br />
              <Grid container spacing={5}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    type="color"
                    size="small"
                    fullWidth
                    label="Text Color"
                    onChange={(e) => setTextColor(e.target.value)}
                    defaultValue={botStyleDetails?.textColor || textColor}
                    disabled
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    type="color"
                    size="small"
                    fullWidth
                    label="Primary Color"
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    defaultValue={botStyleDetails?.primaryColor || primaryColor}
                    disabled
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    type="color"
                    size="small"
                    fullWidth
                    label="Secondary Color"
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    defaultValue={
                      botStyleDetails?.secondaryColor || secondaryColor
                    }
                    disabled
                  />
                </Grid>
              </Grid>

              <br />
              <Grid container spacing={5}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    type="color"
                    size="small"
                    fullWidth
                    label="Header Text Color"
                    onChange={(e) => setHeaderTextColor(e.target.value)}
                    defaultValue={
                      botStyleDetails?.headerTextColor || headerTextColor
                    }
                    disabled
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    type="color"
                    size="small"
                    fullWidth
                    label="Header Background Color"
                    onChange={(e) => setHeaderBackgroundColor(e.target.value)}
                    defaultValue={
                      botStyleDetails?.headerBackgroundColor ||
                      headerBackgroundColor
                    }
                    disabled
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    type="color"
                    size="small"
                    fullWidth
                    label="Button Color"
                    onChange={(e) => setButtonColor(e.target.value)}
                    defaultValue={botStyleDetails?.buttonColor || buttonColor}
                    disabled
                  />
                </Grid>
              </Grid>
              <br />

              <Grid container spacing={5}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    type="color"
                    size="small"
                    fullWidth
                    label="Button Text Color"
                    onChange={(e) => setButtonTextColor(e.target.value)}
                    defaultValue={
                      botStyleDetails?.buttonTextColor || buttonTextColor
                    }
                    disabled
                  />
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel
              value="setting"
              sx={{
                p: 0,
                border: 0,
                boxShadow: 0,
                backgroundColor: 'transparent',
              }}
            >
              <Grid container spacing={5}>
                <Grid item xs={12} sm={12}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Whitelisted Domain"
                    placeholder="Whitelisted Domain"
                    onChange={(e) => setDomains(e.target.value)}
                    defaultValue={botSettingDATADetails?.domains || domains}
                    disabled
                  />
                </Grid>
              </Grid>
              <br />

              <Grid container spacing={5}>
                <Grid item xs={12} sm={12}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label="Greeting Message"
                    onChange={(e) => setWelcomeMessages(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': { alignItems: 'baseline' },
                    }}
                    defaultValue={
                      botSettingDATADetails?.welcomeMessages || welcomeMessages
                    }
                    InputProps={{}}
                    disabled
                  />
                </Grid>
              </Grid>
              <br />

              <Grid container spacing={5}>
                <Grid item xs={12} sm={12}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    defaultValue={
                      botSettingDATADetails?.fallbackMessage || fallbackMessage
                    }
                    label="Fallback Message"
                    onChange={(e) => setFallbackMessage(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': { alignItems: 'baseline' },
                    }}
                    InputProps={{}}
                    disabled
                  />
                </Grid>
              </Grid>
              <br />

              <Grid container spacing={5}>
                <Grid item xs={12} sm={12}>
                  <FormControl fullWidth>
                    <InputLabel
                      id="demo-simple-select-label"
                      style={{ marginTop: '-6px' }}
                    >
                      Blacklisted Countries
                    </InputLabel>
                    <Select
                      size="small"
                      fullWidth
                      disabled
                      multiple
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      value={
                        botSettingDATADetails?.blockedCountries || language
                      }
                      onChange={handleSelectChange}
                      label="Tags"
                    >
                      <MenuItem value="Afghanistan">Afghanistan</MenuItem>
                      <MenuItem value="John">North Korea</MenuItem>
                      <MenuItem value="Breet">Iran</MenuItem>
                      <MenuItem value="Sam">Myanmar</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <br />

              <Grid container spacing={5}>
                <Grid item xs={12} sm={12}>
                  <TextField
                    size="small"
                    fullWidth
                    label="Blocked Contents"
                    onChange={(e) => setBlockedContent(e.target.value)}
                    defaultValue={
                      botSettingDATADetails?.blockedContent || blockedContent
                    }
                    disabled
                  />
                </Grid>
              </Grid>
              <br />

              <Grid container spacing={5}>
                <Grid item xs={12} sm={3}>
                  <span>Transfer Chat</span>
                </Grid>
                <Grid item xs={12} sm={3} style={{ marginTop: '-8px' }}>
                  <Switch
                    {...label}
                    disabled
                    onChange={(e) => setGetVisitorInfo(e.target.checked)}
                    value={
                      botSettingDATADetails?.blockedContent || blockedContent
                    }
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <span>File Transfer</span>
                </Grid>
                <Grid item xs={12} sm={3} style={{ marginTop: '-8px' }}>
                  <Switch {...label} disabled />
                </Grid>
              </Grid>
              <br />

              <Grid container spacing={5}>
                <Grid item xs={12} sm={3}>
                  <span>Typing Indicator</span>
                </Grid>
                <Grid item xs={12} sm={3} style={{ marginTop: '-8px' }}>
                  <Switch
                    {...label}
                    disabled
                    onChange={(e) => setTypingIndicator(e.target.checked)}
                    value={
                      botSettingDATADetails?.typingIndicator || typingIndicator
                    }
                  />
                </Grid>

                <Grid item xs={12} sm={3}>
                  <span>Ask For Feedback</span>
                </Grid>
                <Grid item xs={12} sm={3} style={{ marginTop: '-8px' }}>
                  <Switch
                    {...label}
                    disabled
                    onChange={(e) => setAskForFeedback(e.target.checked)}
                  />
                </Grid>
              </Grid>
              <br />

              <Grid container spacing={5}>
                <Grid item xs={12} sm={3}>
                  <span>Save Cookies</span>
                </Grid>
                <Grid item xs={12} sm={3} style={{ marginTop: '-8px' }}>
                  <Switch
                    {...label}
                    disabled
                    onChange={(e) =>
                      setStoreVisitorInfoInCookies(e.target.checked)
                    }
                  />
                </Grid>
              </Grid>
              <br />

              <Grid container spacing={5}></Grid>
              <br />
            </TabPanel>

            <TabPanel
              value="installation-instuction"
              sx={{
                p: 0,
                border: 0,
                boxShadow: 0,
                backgroundColor: 'transparent',
              }}
            >
              <Grid container spacing={5}>
                <Grid item xs={12} sm={1}>
                  <span style={{ marginTop: '5px;' }}>
                    <Icon icon="mdi:number-one-circle-outline" fontSize={25} />
                  </span>
                </Grid>
                <Grid item xs={12} sm={11}>
                  <span>
                    Copy this code and paste it before the closing body tag on
                    every page of your website.
                  </span>
                </Grid>

                <Grid item xs={12} sm={1}></Grid>
                <Grid item xs={12} sm={10}>
                  <div>
                    <TextField
                      disabled
                      fullWidth
                      multiline
                      minRows={2}
                      label="Copy Your Code"
                      sx={{
                        '& .MuiOutlinedInput-root': { alignItems: 'baseline' },
                      }}
                      value={getDynamicScript()}
                    ></TextField>
                    <Button
                      size="small"
                      type="submit"
                      sx={{ mr: 2, mt: -10, float: 'right' }}
                      variant="outlined"
                    >
                      Copy to clipboard
                    </Button>
                  </div>
                </Grid>
              </Grid>

              <br />
              <Grid container spacing={5}>
                <Grid item xs={12} sm={1}>
                  <span style={{ marginTop: '5px;' }}>
                    <Icon icon="mdi:number-two-circle-outline" fontSize={25} />
                  </span>
                </Grid>
                <Grid item xs={12} sm={11}>
                  <span>
                    Copy this code and paste it before the closing tag on every
                    page of your website.
                  </span>
                </Grid>
              </Grid>
            </TabPanel>
          </CardContent>
          <Divider sx={{ m: '0 !important' }} />
          {/* <CardActions>
                        <Button size='large' type='submit' sx={{ mr: 2 }} variant='contained'>
                            {value === "setting" ? "Submit" : "Next"}
                        </Button>
                        <Button type='reset' size='large' variant='outlined' color='secondary'>
                            Reset
                        </Button>
                    </CardActions> */}
        </form>
      </TabContext>
    </Card>
  );
};

export default BotSetting;
