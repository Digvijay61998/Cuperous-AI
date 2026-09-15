// ** React Imports
import {
  ElementType,
  forwardRef,
  SyntheticEvent,
  useEffect,
  useState,
} from 'react';
import env from 'src/configs/environments';

// ** MUI Imports
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import Button, { ButtonProps } from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import { pink } from '@mui/material/colors';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { alpha, styled } from '@mui/material/styles';
import Switch from '@mui/material/Switch';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Icon from 'src/@core/components/icon';
import Axios from 'src/helper/Axios';
import { AppDispatch, RootState } from 'src/store';
import { fetchAgentList } from 'src/store/apps/agent';
import { gettag } from 'src/store/apps/tags';
import Preview from 'src/views/bots/Preview';
import AddEditQA from 'src/views/question-bank/list/AddEditQ&A';

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
import { Badge, List, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import {
  downloadUnansweredQuestions,
  fetchLanguages,
  getBotDataById,
  getUnansweredQuestions,
  UpdateBotGeneral,
  UpdateBotSettingData,
  UpdateBotStyleData,
} from 'src/store/apps/bots';

import { LoadingButton } from '@mui/lab';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import { DataGrid } from '@mui/x-data-grid';
import React from 'react';
import toast from 'react-hot-toast';
import { access } from 'src/helper/Access';
import { AccessTypesEnum } from 'src/utils';
import QADeleteDialog from './RemoveUnansweredQDialog';
import Link from 'next/link';
import BotDesign from './bot-design';
import axios from 'axios';
import TrainingData from './TrainingData';
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref,
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

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

function getDifference(array1: any[], array2: any[]) {
  return array1?.filter((object1) => {
    return !array2?.some((object2) => {
      return object1.label === object2.label;
    });
  });
}

const ImgStyled = styled('img')(({ theme }) => ({
  width: 100,
  height: 100,
  marginRight: theme.spacing(6.25),
  borderRadius: theme.shape.borderRadius,
}));

const ButtonStyled = styled(Button)<
  ButtonProps & { component?: ElementType; htmlFor?: string }
>(({ theme }) => ({
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    textAlign: 'center',
  },
}));

const BotSetting = () => {
  const [router, setRouter] = useState<any>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { botId } = useRouter().query;

  const [deleteUnansweredQData, setDeleteUnansweredQData] = useState<any>({});
  const [deleteUnansweredQDialogOpen, setDeleteUnansweredQDialogOpen] =
    useState<boolean>(false);
  const [role, setRole] = useState<string>('');
  const [botSettingData, setBotSettingData] = useState<any>({});
  const [botStyleData, setBotStyleData] = useState<any>({});
  const [botSettingMainData, setBotSettingMainData] = useState<any>({});
  const [botSettingLanguages, setBotSettingLanguages] = useState<any>('');
  const [imgSrcBot, setImgSrcBot] = useState<string>('/images/avatars/1.png');
  const [imgSrcWidget, setImgSrcWidget] = useState<string>(
    '/images/avatars/1.png',
  );
  const [language, setAge] = React.useState("JAVASCRIPT");
  const [fileMeta, setFileMeta] = useState<any>([])
  const [filesToUpload, setFilesToUpload] = useState<any>();

  const botSettingDetails = useSelector(
    (state: RootState) => state.bots.botSettingData,
  );
  const botStyleDetails = useSelector(
    (state: any) => state?.bots?.botSettingData?.botStyles,
  );
  const botSettingDATADetails = useSelector(
    (state: any) => state?.bots?.botSettingData?.botSetting,
  );
  const { userData } = useSelector((state: RootState) => state.user);
  const botUnansweredQuestions: any = useSelector(
    (state: RootState) => state?.bots?.botUnansweredQuestions,
  );
  const langList: any = useSelector(
    (state: RootState) => state?.bots?.languages,
  );
  useEffect(() => {
    dispatch(fetchLanguages());
  }, []);
  useEffect(() => {
    if (userData && userData?.role) {
      setRole(userData?.role);
    }
  }, [userData]);
  useEffect(() => {
    if (botId) {
      dispatch(getBotDataById(botId));
      dispatch(getUnansweredQuestions(botId));
    }
  }, [botId]);
  useEffect(() => {
    if (botSettingDetails) {
      setBotSettingData(botSettingDetails);
      setBotSettingLanguages(
        botSettingDATADetails?.languages.map(function (obj: any) {
          return obj.label;
        }),
      );
      setBotStyleData(botStyleDetails);
      setImgSrcBot(botStyleDetails?.avatar);
      setImgSrcWidget(botStyleDetails?.widgetAvatar);
      setBotSettingMainData(botSettingDATADetails);
    }
  }, [botSettingDetails]);

  // ** States
  const [value, setValue] = useState<string>('general');
  const [pageSize, setPageSize] = useState<number>(10);

  const dispatch = useDispatch<AppDispatch>();
  const [selectedColor, setSelectedColor] = useState<string>('');

  const initAddData: any = {
    method: 'add',
    botId: '',
    id: '',
    question: '',
    answers: [''],
    tags: [],
    keywords: [],
  };
  const [openSelectedQA, setOpenSelectedQA] = useState<boolean>(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(initAddData);

  const toggleAddQADrawer = (data: any) => {
    setSelectedQuestion(data);
    setOpenSelectedQA(!openSelectedQA);
  };

  const handleRejectQuestion = (row: any) => {
    setDeleteUnansweredQData({
      botId: botId,
      questionId: row.id,
      showToast: true,
    });
    setDeleteUnansweredQDialogOpen(true);
  };

  const handleTabsChange = (event: SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const handleBotConfigColor = (color: string) => {
    setSelectedColor(color);
  };

  const saveState = (e: any) => {
    setBotSettingData({ ...botSettingData, [e.target.name]: e.target.value });
  };
  const saveStateGeneralChecked = (e: any) => {
    setBotSettingData({
      ...botSettingData,
      [e.target.name]: e.target.checked,
    });
  };
  const saveStateSetting = (e: any) => {
    setBotSettingMainData({
      ...botSettingMainData,
      [e.target.name]: e.target.value,
    });
  };
  const saveStateSettingLang = (e: any) => {
    setBotSettingLanguages(e.target.value);
  };
  const saveStateSettingAsList = (e: any) => {
    let value = e.target.value.split(',').map((item: string) => item.trim());
    setBotSettingMainData({
      ...botSettingMainData,
      [e.target.name]: value,
    });
  };
  const saveStateSettingChecked = (e: any) => {
    setBotSettingMainData({
      ...botSettingMainData,
      [e.target.name]: e.target.checked,
    });
  };

  const uploadFileServer = async (e: any, file: any) => {
    if (file.size > 810032) {
      toast.error('Try to upload less than 800KB');
      return;
    }
    try {
      let formData = new FormData();
      formData.append('file', file);
      const res: any = await Axios.post('/file', formData);
      return res.data.url;
    } catch (error: any) {
      toast.error(error.response.data.message || error.message || 'Failed...');
      return;
    }
  };

  const handleUploadBotImage = async (e: any) => {
    var file = e.target.files[0];
    const imageUrl = await uploadFileServer(e, file);
    setImgSrcBot(`${env.baseurl}/api${imageUrl}`);
  };

  const handleUploadWidgetImage = async (e: any) => {
    var file = e.target.files[0];
    const imageUrl = await uploadFileServer(e, file);
    setImgSrcWidget(`${env.baseurl}/api${imageUrl}`);
  };

  const saveStateStyling = (e: any) => {
    setBotStyleData({ ...botStyleData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();    
    if (value === 'general') {
      dispatch(
        UpdateBotGeneral({
          ...botSettingData,
          agents: botSettingData.agents.map((el: any) =>
            typeof el === 'object' ? el._id : el,
          ),
        }),
      );
    }

    if (value === 'setting') {
      let langsList: any = [];
      langList.map((itm: any) => {
        if (botSettingLanguages.includes(itm.label)) {
          langsList.push(itm);
        }
      });
      dispatch(
        UpdateBotSettingData({ ...botSettingMainData, languages: langsList }),
      );
    }

    if (value === 'design') {
      dispatch(
        UpdateBotStyleData({
          ...botStyleData,
          avatar: imgSrcBot,
          widgetAvatar: imgSrcWidget,
        }),
      );
    }

    if (value === 'training-data') {
      // Training data is now managed by the dedicated <TrainingData /> component
      // (its own upload / scrape / list / delete). Nothing to do on form submit.
      return;
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
  const getDynamicScript = (lang : string) => {
    return lang === "JAVASCRIPT" ? `<!-- Start of JarCube code -->
    <script type='module'>
    window.botId =  '${botId}';
    window.baseUrl = '${env.baseurl}';
    window.isOpenChat = false;
    import jarcube from '${env.widgetUrl}';
    jarcube();
  </script>
    <!-- End of JarCube code -->
` : lang === "REACTJS" ? `<!-- Add The Following Code in whatever component you want the chatbot To be -->
<!-- Start of JarCube code -->
React.useEffect(() => {
  window.botId = '${botId}';
  window.baseUrl = '${env.baseurl}';
  window.isOpenChat = false;
  import('${env.widgetUrl}')
    .then((module) => {
      module.default();
    })
    .catch((error) => {
      // Handle any errors
    });
}, []);
<!-- End of JarCube code -->` 
  : lang === "VUEJS" ? `<!-- Add The Following Code in whatever component you want the chatbot To be -->
  <!-- Start of JarCube code -->
  <script>
  export default {
    mounted() {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = '${env.widgetUrl}';
      document.body.appendChild(script);
  
      // Optional: You can set window properties here if needed
      window.botId = '${botId}';
      window.baseUrl = '${env.baseurl}';
      window.isOpenChat = false;
  
      // Optional: Call the jarcube function manually if needed
      window.jarcube();
    }
  }
  </script>
  <!-- End of JarCube code -->`
  : lang === "ANGULAR" ? `
  <!-- In the component's HTML template file, add the following code snippet within the <script> tag. Angular will automatically execute the code when the template is rendered -->
  <!-- Start of JarCube code -->
  <script type="module">
  window.botId = '${botId}';
  window.baseUrl = '${env.baseurl}';
  window.isOpenChat = false;
  import jarcube from '${env.widgetUrl}';
  jarcube();
</script>
<!-- End of JarCube code -->`
  : "Working On It"

  };

  // copy to clipboard for web

  const [copyWebText, setCopyWebText] = useState(getDynamicScript(language));
  const handleWebCopy = () => {
    navigator.clipboard.writeText(getDynamicScript(language));
    toast.success('Copied to clipboard');
  };

  // copy to clipboard for Mobile
  const [copyMobileText, setCopyMobileText] = useState(getDynamicScript(language));
  const handleMobileCopy = () => {
    navigator.clipboard.writeText(copyMobileText);
    toast.success('Copied to clipboard');
  };

  const handleFileList = (e:any)=>{
    // e.preventDefault()
    console.log("[ EVENT FILES ]", e.target.files);
    setFilesToUpload(e.target.files)
  }

  const columns = [
    {
      flex: 1,
      minWidth: 200,
      field: 'question',
      headerName: 'Question',
      renderCell: ({ row }: any) => {
        return (
          <>
            <Typography>{row.question}</Typography>
          </>
        );
      },
    },
    {
      flex: 1,
      minWidth: 140,
      headerName: 'Asked By',
      field: 'askedBy',
      sort: 'desc',
      renderCell: ({ row }: any) => {
        return (
          <List>
            <Typography>{row?.askedBy?.name}</Typography>
            <Typography>{row?.askedBy?.email}</Typography>
          </List>
        );
      },
    },
    {
      flex: 1,
      minWidth: 140,
      headerName: 'Asked On',
      field: 'time',
      sort: 'desc',
      renderCell: ({ row }: any) => {
        return (
          <span>
            {new Date(row.time).toLocaleDateString('en-US', {
              hour: 'numeric',
              minute: 'numeric',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        );
      },
    },
    {
      flex: 1,
      minWidth: 120,
      sortable: false,
      field: 'action',
      headerName: 'Action',
      renderCell: ({ row }: any) => {
        return (
          <>
            <Tooltip placement="top" title="Add Answer" arrow>
              <IconButton
                aria-label="answer"
                size="small"
                sx={{ mr: 2 }}
                color="primary"
                onClick={() => {
                  let tagItems = [];
                  // let langItems = [];
                  if (botSettingData?.tags?.length > 0) {
                    tagItems = storeTag.filter((p) =>
                      botSettingData?.tags.includes(p._id),
                    );
                  }
                  // if(botSettingMainData?.languages?.length>0) {
                  //   langItems = langList.filter((p) => botSettingMainData?.languages.includes(p.value));
                  // }
                  toggleAddQADrawer({
                    method: 'add',
                    botId: botId,
                    id: row?.id,
                    question: row?.question || '',
                    answers: [''],
                    languages: botSettingMainData?.languages || [],
                    language: botSettingMainData?.language || '',
                    tags: tagItems,
                    keywords: row?.keywords || [],
                  });
                }}
              >
                <Icon icon="ic:round-question-answer" fontSize={20} />
              </IconButton>
            </Tooltip>

            <Tooltip placement="top" title="Remove" arrow>
              <IconButton
                aria-label="delete"
                size="small"
                color="error"
                sx={{ mr: 2 }}
                onClick={() => handleRejectQuestion(row)}
              >
                <Icon icon="bx:trash" fontSize={20} />
              </IconButton>
            </Tooltip>
          </>
        );
      },
    },
  ];

  const handleChange = (event : any) => {
    setAge(event.target.value);
  };

  return (
    <Card  sx={{
      boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'
    }}>

      <TabContext value={value} >

        <TabList
          variant="scrollable"
          scrollButtons={false}
          onChange={handleTabsChange}
          sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
        >
          <Tab value="general" label="General" />
          {role && access(role, AccessTypesEnum.UPDATE) && (
            <Tab value="design" label="Design" />
          )}
          {role && access(role, AccessTypesEnum.UPDATE) && (
            <Tab value="setting" label="Settings" />
          )}
          <Tab value="installation-instuction" label="Installation" />
          <Tab
            value="new"
            label={
              <Badge
                color="primary"
                badgeContent={botUnansweredQuestions?.questions?.length || 0}
                max={99}
              >
                <div style={{ padding: '0 10px' }}>New</div>
              </Badge>
            }
          />
          <Tab value="training-data" label="Training Data" />
        </TabList>
        <form onSubmit={(e) => handleSubmit(e)}>
          <CardContent style={value === 'new' ? { padding: '1.5rem 0 0' } : {}}>
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
                    onChange={saveState}
                    value={botSettingData?.name || name}
                    name="name"
                    fullWidth
                    label="Bot Name"
                    placeholder="Bot Name"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
              <br />

              <Grid container spacing={5}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="demo-simple-select-label">Tags</InputLabel>
                    <Select
                      size="small"
                      fullWidth
                      multiple
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      onChange={saveState}
                      value={botSettingData?.tags || []}
                      name="tags"
                      label="Tags"
                    >
                      {storeTag.length > 0 &&
                        storeTag.map((item: any, index: number) => (
                          <MenuItem key={index} value={item._id}>
                            {item.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <br />

              <Grid container spacing={5}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="demo-simple-select-label">
                      Agents
                    </InputLabel>
                    <Select
                      size="small"
                      fullWidth
                      multiple
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      onChange={saveState}
                      value={
                        (botSettingData?.agents &&
                          botSettingData?.agents.map((el: any) =>
                            typeof el === 'object' ? el._id : el,
                          )) ||
                        []
                      }
                      name="agents"
                      label="agents"
                    >
                      {storeAgent.length > 0 &&
                        storeAgent.map((item: any, index: number) => (
                          <MenuItem key={index} value={item._id}>
                            {item.name}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <br />

              {/*<Grid container spacing={5}>
                <Grid item xs={12} sm={3}>
                    <span>URL</span>
                </Grid>
                <Grid item xs={12} sm={9}>
                    <TextField size="small" fullWidth label='URL' placeholder='URL' />
                </Grid>
              </Grid>
              <br />
              <Grid container spacing={5}>
                <Grid item xs={12}>
                  <ColorSchemeConfig
                    handleBotConfigColor={handleBotConfigColor}
                  />
                </Grid>
              </Grid> */}
              <Grid container>
                <Grid item xs={12} sm={6}>
                  <Grid container>
                    <Grid item xs={6}>
                      <span>
                        Question Bank
                        <Tooltip
                          title="You can use question and answer at bot flow"
                          arrow
                        >
                          <IconButton>
                            <Icon
                              icon="material-symbols:info-outline-rounded"
                              fontSize={20}
                            />
                          </IconButton>
                        </Tooltip>
                      </span>
                    </Grid>
                    <Grid item xs={6}>
                      <Switch
                        {...label}
                        // defaultChecked
                        onChange={saveStateGeneralChecked}
                        checked={botSettingData?.questionBank}
                        name="questionBank"
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Grid container>
                    <Grid item xs={8}>
                      <span>
                        Save unanswered question
                        <Tooltip
                          title="Save or reject the unanswered questions"
                          arrow
                        >
                          <IconButton>
                            <Icon
                              icon="material-symbols:info-outline-rounded"
                              fontSize={20}
                            />
                          </IconButton>
                        </Tooltip>
                      </span>
                    </Grid>
                    <Grid item xs={4}>
                      <Switch
                        {...label}
                        // defaultChecked
                        onChange={saveStateGeneralChecked}
                        checked={botSettingData?.saveUnansweredQuestions}
                        name="saveUnansweredQuestions"
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Grid container>
                    <Grid item xs={6}>
                      <span>
                        Offer
                        <Tooltip
                          title="You can show offer cards at bot widget"
                          arrow
                        >
                          <IconButton>
                            <Icon
                              icon="material-symbols:info-outline-rounded"
                              fontSize={20}
                            />
                          </IconButton>
                        </Tooltip>
                      </span>
                    </Grid>
                    <Grid item xs={6}>
                      <Switch
                        {...label}
                        // defaultChecked
                        onChange={saveStateGeneralChecked}
                        checked={botSettingData?.showOffer}
                        name="showOffer"
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Grid container>
                    <Grid item xs={8}>
                      <span>
                        Advertisement
                        <Tooltip
                          title="You can show advertisement posters at bot widget"
                          arrow
                        >
                          <IconButton>
                            <Icon
                              icon="material-symbols:info-outline-rounded"
                              fontSize={20}
                            />
                          </IconButton>
                        </Tooltip>
                      </span>
                    </Grid>
                    <Grid item xs={4}>
                      <Switch
                        {...label}
                        // defaultChecked
                        onChange={saveStateGeneralChecked}
                        checked={botSettingData?.showAdvertisement}
                        name="showAdvertisement"
                      />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Grid container>
                    <Grid item xs={6}>
                      <span>
                        Scrapping
                        <Tooltip
                          title="Scrapped data will be used to answer incase question and answers are not found"
                          arrow
                        >
                          <IconButton>
                            <Icon
                              icon="material-symbols:info-outline-rounded"
                              fontSize={20}
                            />
                          </IconButton>
                        </Tooltip>
                      </span>
                    </Grid>
                    <Grid item xs={6}>
                      <Switch
                        {...label}
                        // defaultChecked
                        onChange={saveStateGeneralChecked}
                        checked={botSettingData?.useScrapping}
                        name="useScrapping"
                      />
                    </Grid>
                  </Grid>
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
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ m: 2, textAlign: 'center' }}>
                    Bot Avatar
                  </Typography>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Button
                      variant="contained"
                      component="label"
                      style={{
                        width: 150,
                        height: 150,
                        overflow: 'hidden',
                        borderRadius: '50%',
                      }}
                      sx={{ bgcolor: '#A2A2A2' }}
                    >
                      <div
                        style={{
                          backgroundImage: `url(${imgSrcBot})`,
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center center',
                          width: 150,
                          height: 150,
                          objectFit: 'scale-down',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',

                            alignItems: 'center',
                            width: 150,
                            height: 150,
                          }}
                        >
                          <Icon icon="bx:camera" fontSize={18} />
                          <span style={{ fontSize: '10px' }}>Upload Photo</span>
                          <input
                            hidden
                            accept="image/*"
                            onChange={(e: any) => handleUploadBotImage(e)}
                            type="file"
                          />
                        </div>
                      </div>
                    </Button>
                  </div>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography sx={{ m: 2, textAlign: 'center' }}>
                    Widget Avatar
                  </Typography>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Button
                      variant="contained"
                      component="label"
                      style={{
                        width: 150,
                        height: 150,
                        overflow: 'hidden',
                        borderRadius: '50%',
                      }}
                      sx={{ bgcolor: '#A2A2A2' }}
                    >
                      <div
                        style={{
                          backgroundImage: `url(${imgSrcWidget})`,
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center center',
                          width: 150,
                          height: 150,
                          objectFit: 'scale-down',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',

                            alignItems: 'center',
                            width: 150,
                            height: 150,
                          }}
                        >
                          <Icon icon="bx:camera" fontSize={18} />
                          <span style={{ fontSize: '10px' }}>Upload Photo</span>
                          <input
                            hidden
                            accept="image/*"
                            onChange={(e: any) => handleUploadWidgetImage(e)}
                            type="file"
                          />
                        </div>
                      </div>
                    </Button>
                  </div>
                </Grid>
                <Grid item xs={12}>
                  <Typography
                    sx={{ m: 4, color: 'text.disabled', textAlign: 'center' }}
                  >
                    Allowed image with maximum size of 800KB.
                  </Typography>
                </Grid>
              </Grid>

              <br />
              <Grid container spacing={5}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    type="color"
                    size="small"
                    fullWidth
                    label="Text Color"
                    onChange={saveStateStyling}
                    value={botStyleData?.textColor}
                    name="textColor"
                  />
                </Grid>

                <Grid item xs={12} sm={4}>
                  <TextField
                    type="color"
                    size="small"
                    fullWidth
                    label="Primary Color"
                    onChange={saveStateStyling}
                    value={botStyleData?.primaryColor}
                    name="primaryColor"
                  />
                </Grid>

                {/* <Grid item xs={12} sm={4}>
                  <TextField
                    type="color"
                    size="small"
                    fullWidth
                    label="Secondary Color"
                    onChange={saveStateStyling}
                    value={botStyleData?.secondaryColor}
                    name="secondaryColor"
                  />
                </Grid> */}
                <Grid item xs={12} sm={4}>
                  <TextField
                    type="color"
                    size="small"
                    fullWidth
                    label="Header Text Color"
                    onChange={saveStateStyling}
                    value={botStyleData?.headerTextColor}
                    name="headerTextColor"
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
                    onChange={saveStateStyling}
                    value={botStyleData?.buttonTextColor}
                    name="buttonTextColor"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    type="color"
                    size="small"
                    fullWidth
                    label="Button Color"
                    onChange={saveStateStyling}
                    value={botStyleData?.buttonColor}
                    name="buttonColor"
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  {/* Widget Position left or right */}
                  <TextField
                    size="small"
                    fullWidth
                    select
                    label="Widget Position"
                    defaultValue=""
                    id="form-layouts-collapsible-select"
                    onChange={saveStateStyling}
                    value={botStyleData?.widgetPosition}
                    name="widgetPosition"
                  >
                    <MenuItem value="right">Right</MenuItem>
                    <MenuItem value="left">Left</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
              <br />
              {/* <BotDesign
                botStyleData={botStyleData}
                saveStateStyling={saveStateStyling}
              /> */}
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
                    fullWidth
                    multiline
                    minRows={2}
                    label="Whitelisted Domain"
                    sx={{
                      '& .MuiOutlinedInput-root': { alignItems: 'baseline' },
                    }}
                    placeholder="Whitelisted Domain"
                    onChange={saveStateSettingAsList}
                    value={botSettingMainData?.domains}
                    name="domains"
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
                    //onChange={(e) => setWelcomeMessages(e.target.value)}

                    sx={{
                      '& .MuiOutlinedInput-root': { alignItems: 'baseline' },
                    }}
                    onChange={saveStateSetting}
                    value={botSettingMainData?.welcomeMessages}
                    name="welcomeMessages"
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
                    label="Fallback Message"
                    sx={{
                      '& .MuiOutlinedInput-root': { alignItems: 'baseline' },
                    }}
                    onChange={saveStateSetting}
                    value={botSettingMainData?.fallbackMessage}
                    name="fallbackMessage"
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
                    label="Thank You Message"
                    onChange={saveStateSetting}
                    value={botSettingMainData?.thankyoumsg}
                    name="thankyoumsg"
                  />
                </Grid>
              </Grid>
              <br />

              <Grid container spacing={5}>
                <Grid item xs={12} sm={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="demo-simple-select-label">
                      Blacklisted Countries
                    </InputLabel>
                    <Select
                      size="small"
                      fullWidth
                      multiple
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      onChange={saveStateSetting}
                      value={botSettingMainData?.blockedCountries || []}
                      label="Blacklisted Countries"
                      name="blockedCountries"
                    >
                      <MenuItem value="Pakistan">Pakistan</MenuItem>
                      <MenuItem value="Zimbabwe">Zimbabwe</MenuItem>
                      <MenuItem value="Yemen">Yemen</MenuItem>
                      <MenuItem value="Uganda">Uganda</MenuItem>
                      <MenuItem value="Syria">Syria</MenuItem>
                      <MenuItem value="Panama">Panama</MenuItem>
                      <MenuItem value="Nicaragua">Nicaragua</MenuItem>
                      <MenuItem value="Myanmar">Myanmar</MenuItem>
                      <MenuItem value="Mauritius">Mauritius</MenuItem>
                      <MenuItem value="Jamaica">Jamaica</MenuItem>
                      <MenuItem value="Ghana">Ghana</MenuItem>
                      <MenuItem value="Botswana">Botswana</MenuItem>
                      <MenuItem value="Barbados">Barbados</MenuItem>
                      <MenuItem value="The Bahamas">The Bahamas</MenuItem>
                      <MenuItem value="Albania">Albania</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <br />

              <Grid container spacing={5}>
                <Grid item xs={12} sm={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="demo-simple-select-label">
                      Languages
                    </InputLabel>
                    <Select
                      size="small"
                      fullWidth
                      multiple
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      onChange={saveStateSettingLang}
                      value={botSettingLanguages || []}
                      label="Languages"
                      name="languages"
                      sx={{ textTransform: 'capitalize' }}
                      // renderValue={(selected) => (
                      //   <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      //     {selected.map((obj:any) => {
                      //       return (
                      //         <Chip
                      //           key={obj?.value}
                      //           sx={{fontSize: '11px'}}
                      //           // onDelete={(e:any) => {
                      //           //   e.stopPropagation();
                      //           //   handleDeleteLang(obj);
                      //           // }}
                      //           label={obj?.label}
                      //           color='primary'
                      //         />
                      //       );
                      //     })}
                      //   </Box>
                      // )}
                    >
                      {langList.map((lang: any, index: number) => (
                        <MenuItem
                          value={lang.label}
                          key={index}
                          sx={{ textTransform: 'capitalize' }}
                        >
                          {lang.label}
                        </MenuItem>
                      ))}
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
                    onChange={saveStateSettingAsList}
                    value={botSettingMainData?.blockedContent}
                    name="blockedContent"
                  />
                </Grid>
              </Grid>
              {/* <br />

              <Grid container>
                <Grid item xs={12} sm={4}>
                  
                    <span>Transfer Chat 
                        
                        <Tooltip title="Transfer Chat" arrow>
                          <IconButton>
                            <Icon icon="material-symbols:info-outline-rounded" fontSize={20}/>
                          </IconButton>
                        </Tooltip>
                        
                    </span>
                    
                  
                </Grid>
                
                <Grid item xs={12} sm={2}>
                  <Switch {...label} defaultChecked />
                </Grid>

                <Grid item xs={12} sm={4}>
                  
                    <span>File Transfer
                      <Tooltip title="File Transfer" arrow>
                          <IconButton>
                            <Icon icon="material-symbols:info-outline-rounded" fontSize={20}/>
                          </IconButton>
                      </Tooltip>
                    </span>
                 
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Switch {...label} defaultChecked />
                </Grid>
              </Grid> */}
              <br />

              <Grid container>
                {/* <Grid item xs={12} sm={4}>
                  <span>
                    Typing Indicator
                    <Tooltip
                      title="To give user real experience, introduce a delay in response from bot side. It is typically .3 to .5 seconds. "
                      arrow
                    >
                      <IconButton>
                        <Icon
                          icon="material-symbols:info-outline-rounded"
                          fontSize={20}
                        />
                      </IconButton>
                    </Tooltip>
                  </span>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Switch
                    {...label}
                    defaultChecked
                    // onClick={() => setTypingIndicator(typingIndicator)}
                    onChange={saveStateSettingChecked}
                    checked={botSettingMainData?.typingIndicator}
                    name="typingIndicator"
                  />
                </Grid> */}

                <Grid item xs={4} sm={4}>
                  <span>
                    Save Local Storage
                    <Tooltip
                      title="If enabled, system stores and reuses the visitor details to identify the revisiting users."
                      arrow
                    >
                      <IconButton>
                        <Icon
                          icon="material-symbols:info-outline-rounded"
                          fontSize={20}
                        />
                      </IconButton>
                    </Tooltip>
                  </span>
                </Grid>
                <Grid item xs={2} sm={2}>
                  <Switch
                    {...label}
                    defaultChecked
                    // onClick={() => setSaveCookies(saveCookies)}
                    onChange={saveStateSettingChecked}
                    checked={botSettingMainData?.storeVisitorInfoInCookies}
                    name="storeVisitorInfoInCookies"
                  />
                </Grid>
                <Grid item xs={4} sm={4}>
                  <span>
                    Ask For Feedback
                    <Tooltip
                      title="Allows visitor to give 1-5 star feedback to the service that they have got from the bot or agent while their conversation. "
                      arrow
                    >
                      <IconButton>
                        <Icon
                          icon="material-symbols:info-outline-rounded"
                          fontSize={20}
                        />
                      </IconButton>
                    </Tooltip>
                  </span>
                </Grid>
                <Grid item xs={2} sm={2}>
                  <Switch
                    {...label}
                    defaultChecked
                    // onClick={() => setAskForFeedback(askForFeedback)}
                    onChange={saveStateSettingChecked}
                    checked={botSettingMainData?.askForFeedback}
                    name="askForFeedback"
                  />
                </Grid>
              </Grid>

              <Grid container>
                <Grid item xs={12} sm={4}>
                  <span>
                    Get Location Info
                    <Tooltip
                      title="If enabled, system will ask for visitor's location information."
                      arrow
                    >
                      <IconButton>
                        <Icon
                          icon="material-symbols:info-outline-rounded"
                          fontSize={20}
                        />
                      </IconButton>
                    </Tooltip>
                  </span>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Switch
                    {...label}
                    defaultChecked
                    // onClick={() => setVisitorInfo(visitorInfo)}
                    onChange={saveStateSettingChecked}
                    checked={botSettingMainData?.isLocation}
                    name="isLocation"
                  />
                </Grid>
              </Grid>
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
                <Grid sx={{display : "flex", flexDirection : "column"}} item xs={12} sm={11}>
                  <span>
                    Copy this code and paste it before the closing body tag on
                    every page of your website (For Web).<br/><br/>
                    Select The Language You Need.
                  </span>
                  <FormControl sx={{ m: 1, maxWidth: 120, marginTop : "2em" }}>
                    <InputLabel id="demo-simple-select-helper-label">Language</InputLabel>
                    <Select
                      labelId="demo-simple-select-helper-label"
                      id="demo-simple-select-helper"
                      value={language}
                      label="Language"
                      onChange={handleChange}
                    >
                      <MenuItem value={"JAVASCRIPT"}>JavaScript</MenuItem>
                      <MenuItem value={"REACTJS"}>React.Js</MenuItem>
                      <MenuItem value={"VUEJS"}>Vue.Js</MenuItem>
                      <MenuItem value={"ANGULAR"}>Angular</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={1}></Grid>
                <Grid item xs={12} sm={10}>
                  <div>
                    <TextField
                      fullWidth
                      multiline
                      minRows={6}
                      spellCheck={false}
                      variant="filled"
                      label="Copy Your Code"
                      sx={{
                        '& .MuiOutlinedInput-root': { alignItems: 'baseline' },
                      }}
                      value={getDynamicScript(language)}
                    ></TextField>
                    <br />
                    <Button
                      size="small"
                      type="submit"
                      sx={{ mr: 0, mt: 3, float: 'right' }}
                      variant="outlined"
                      onClick={handleWebCopy}
                    >
                      Copy to clipboard
                    </Button>
                  </div>
                </Grid>
              </Grid>

              <br />
              {/* <Grid container spacing={5}>
                <Grid item xs={12} sm={1}>
                  <span style={{ marginTop: '5px;' }}>
                    <Icon icon="mdi:number-two-circle-outline" fontSize={25} />
                  </span>
                </Grid>
                <Grid item xs={12} sm={11}>
                  <span>
                    Copy this code and paste it before the closing tag on every
                    page of your website (For Mobile/Native).
                  </span>
                </Grid>

                <Grid item xs={12} sm={1}></Grid>
                <Grid item xs={12} sm={10}>
                  <div>
                    <TextField
                      fullWidth
                      multiline
                      minRows={6}
                      variant="filled"
                      label="Copy Your Code"
                      sx={{
                        '& .MuiOutlinedInput-root': { alignItems: 'baseline' },
                      }}
                      onChange={(e) => setCopyMobileText(e.target.value)}
                      value={getDynamicScript()}
                    ></TextField>
                    <br />
                    <Button
                      size="small"
                      type="submit"
                      sx={{ mr: 0, mt: 3, float: 'right' }}
                      variant="outlined"
                      onClick={handleMobileCopy}
                    >
                      Copy to clipboard
                    </Button>
                  </div>
                </Grid>
              </Grid> */}
            </TabPanel>

            <TabPanel
              value="new"
              sx={{
                p: 0,
                border: 0,
                boxShadow: 0,
                backgroundColor: 'transparent',
              }}
            >
              <div
                style={{
                  padding: '0 10px 10px',
                  gap: 5,
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontSize: '1.25rem', fontWeight: 500 }}>
                  Unanswered Questions
                </div>
                <LoadingButton
                  loading={isLoading}
                  color="primary"
                  size="small"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsLoading(true);
                    dispatch(downloadUnansweredQuestions({ botId: botId }));
                    setIsLoading(false);
                  }}
                  variant="contained"
                  disabled={botUnansweredQuestions?.questions < 1}
                >
                  Download
                </LoadingButton>
              </div>
              <DataGrid
                autoHeight
                rows={botUnansweredQuestions?.questions ?? []}
                columns={columns}
                getRowId={(row: any) => row.id}
                pageSize={pageSize}
                disableSelectionOnClick
                rowsPerPageOptions={[10, 25, 50]}
                onPageSizeChange={(newPageSize: number) =>
                  setPageSize(newPageSize)
                }
                getRowHeight={() => 'auto'}
                initialState={{
                  sorting: {
                    sortModel: [{ field: 'time', sort: 'desc' }],
                  },
                }}
              />
            </TabPanel>

            <TabPanel
              value="training-data"
              sx={{
                p: 0,
                border: 0,
                boxShadow: 0,
                backgroundColor: 'transparent',
              }}
            >
              {botId && <TrainingData botId={`${botId}`} />}
            </TabPanel>
          </CardContent>
          <Divider sx={{ m: '0 !important' }} />
          {role && access(role, AccessTypesEnum.UPDATE) && (
            <CardActions sx={{ justifyContent: 'flex-end' }}>
              <Button
                // size="large"
                type="submit"
                sx={{
                  mr: 2,
                  display:
                    value === 'installation-instuction' ||
                    value === 'new' ||
                    value === 'training-data'
                      ? 'none'
                      : 'block',
                }}
                variant="contained"
              >
                {value === 'setting' ? 'Submit' : 'Save'}
              </Button>
              {/* <Button
              type="reset"
              size="large"
              variant="outlined"
              color="secondary"
            >
              Reset
            </Button> */}
            </CardActions>
          )}
        </form>
      </TabContext>

      <AddEditQA
        open={openSelectedQA}
        toggle={() => {
          setSelectedQuestion(initAddData);
          setOpenSelectedQA(!openSelectedQA);
        }}
        data={selectedQuestion}
      />

      <QADeleteDialog
        data={deleteUnansweredQData}
        open={deleteUnansweredQDialogOpen}
        setOpen={setDeleteUnansweredQDialogOpen}
      />

      <Grid item xs={4} style={{ paddingTop: '13px' }}>
        <Preview
          botName={botSettingData?.name}
          textColor={botSettingData?.textColor}
          headerBgColor={botStyleData?.primaryColor}
          primaryColor={botStyleData?.primaryColor}
          headerTextColor={botStyleData?.headerTextColor}
          primaryTextColor={botStyleData?.primaryTextColor}
          buttonColor={botStyleData?.buttonColor}
          buttonTextColor={botStyleData?.buttonTextColor}
          avatar={imgSrcBot}
          widgetAvatar={imgSrcWidget}
        />

        {/* headerBgColor={primaryColor} headerTextColor={primaryColor} primaryColor={primaryColor} 
            primaryTextColor={primaryColor} buttonColor={primaryColor} buttonTextColor={primaryColor} */}
      </Grid>
    </Card>
  );
};

export default BotSetting;
