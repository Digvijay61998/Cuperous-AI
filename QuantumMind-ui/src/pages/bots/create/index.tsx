// ** React Imports
import { useEffect, useState } from 'react';

// ** MUI Imports
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import TextField from '@mui/material/TextField';
// ** Type Import

// ** Hook Import

import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import { CreateBotData, uploadFilesForBot } from 'src/store/apps/bots';
import ColorSchemeConfig from 'src/views/bots/bot-setting/color-scheme-config';
// import  {data} from 'src\@fake-db\pages\profile'
import { useRouter } from 'next/router';

import { fetchAgentList } from 'src/store/apps/agent';
import { gettag } from 'src/store/apps/tags';
import Preview from 'src/views/bots/Preview';

interface State {
  password: string;
  showPassword: boolean;
}

function CreateBot() {
  const router = useRouter();
  // ** States
  const [values, setValues] = useState<State>({
    password: '',
    showPassword: false,
  });
  const [confirmPassValues, setConfirmPassValues] = useState<State>({
    password: '',
    showPassword: false,
  });

  const [language, setLanguage] = useState<string[]>([]);

  /**BOT CONFIG COLOR SELECTION */
  const [selectedColor, setSelectedColor] = useState<string>('#00a7ff');

  // Handle Select
  const handleSelectChange = (event: SelectChangeEvent<string[]>) => {
    setLanguage(event.target.value as string[]);
  };

  const handleBotConfigColor = (color: string) => {
    setSelectedColor(color);
  };

  const [name, setName] = useState('');
  const [tags, setTags] = useState<any>([]);
  const [agents, setAgents] = useState<any>([]);
  const [type, setType] = useState<any>("")
  const [fileMeta, setFileMeta] = useState<any>([])
  // const navigate=useNavigate()
  const primaryColor = selectedColor;

  const dispatch = useDispatch<AppDispatch>();

  const [data, setData] = useState({
    name: '',
    tags: [],
    agents: [],
  });

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setData({
      name,
      tags,
      agents,
    });
    // const data = {name:name}
    dispatch(CreateBotData({ name, tags, agents, primaryColor, botType : type })).then(
      (data) => {
        const routeData: any = {
          name,
          tags,
          agents,
          primaryColor,
          botType : `${type}`
        };
        sessionStorage.setItem('botSettings', JSON.stringify(routeData));
        router.push(`/bots/settings?botId=${data?.payload?._id || data?.payload?.id}`);
      },
    );
  };

  const [tagList, setTagList] = useState<any>([]);
  const [agentList, setAgentList] = useState<any>([]);

  const store = useSelector((state: RootState) => state.tags);

  const storeAgent = useSelector((state: RootState) => state.agent);

  const typeList = [
  {
    id : 1,
    value : "SIMPLE_BOT",
    name : "Simple Bot"
  },
  {
    id : 2,
    value : "AI_BOT",
    name : "AI Bot"
  } 
  ]

  // const handleFileList = (e:any)=>{
  //   e.preventDefault()
  //   // const FilesToUpload = Object.keys(e.target.files).map(key=>e.target.files[key])
  //   const formData = new FormData()
  //     formData.append("files", e.target.files)
  //     formData.append("userId", "")
  //     const response = dispatch(uploadFilesForBot(formData)).then(data=>{
  //       return setFileMeta([...fileMeta, data])
  //     }) 
  //   return response
  // }

  useEffect(() => {
    dispatch(gettag());
    dispatch(fetchAgentList());
  }, [dispatch]);
  useEffect(() => {
    if (store.list) {
      setTagList(store.list);
    }

    if (storeAgent.agentListData.data) {
      setAgentList(storeAgent.agentListData.data);
    }
  }, [storeAgent, store]);

  return (
    <div id="bot-details" style={{ height: '100%', position: 'relative' }}>
      <Grid container spacing={5}>
        <Grid item xs={8}>
          <Card  sx={{
      boxShadow:'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px'
    }}>
            <CardHeader title="Configure Your Bot" />
            <CardContent>
                <Grid container spacing={5}>
                  <Grid item xs={12} >
                    <TextField
                      fullWidth
                      size="small"
                      label="Bot Name"
                      name="name"
                      id="name"
                      placeholder="Bot Name"
                      onChange={(e) => setName(e.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel
                        id="demo-simple-select-label"
                        style={{ marginTop: '-6px' }}
                      >
                        Bot Type
                      </InputLabel>
                      <Select
                        size="small"
                        fullWidth
                        name="type"
                        id="type"
                        labelId="demo-simple-select-label"
                        value={type}
                        //onChange={handleSelectChange}
                        onChange={(e: any) => {
                          return setType(e.target.value)
                        }}
                        label="Tags"
                      >
                        {typeList.length > 0 &&
                          typeList.map((item: any, index: number) => (
                            <MenuItem key={index} value={item.value}>
                              {item.name}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* {
                    type === "AI_BOT" && <Grid item xs={12}>
                    <FormControl fullWidth>
                      <input
                        // size="small"
                        name="name"
                        id="file"
                        multiple
                        type={"file"}
                        onChange={(e) => {
                          return handleFileList(e)
                        }}
                      ></input>
                    </FormControl>
                  </Grid>
                  } */}

                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel
                        id="demo-simple-select-label"
                        style={{ marginTop: '-6px' }}
                      >
                        Tags
                      </InputLabel>
                      <Select
                        size="small"
                        fullWidth
                        name="tags"
                        id="tags"
                        multiple
                        labelId="demo-simple-select-label"
                        value={tags}
                        //onChange={handleSelectChange}
                        onChange={(e: any) => setTags(e.target.value)}
                        label="Tags"
                      >
                        {tagList.length > 0 &&
                          tagList.map((item: any, index: number) => (
                            <MenuItem key={index} value={item?._id || item?.id}>
                              {item.name}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>

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
                        name="agents"
                        id="agents"
                        multiple
                        labelId="demo-simple-select-label"
                        value={agents}
                        //onChange={handleSelectChange}
                        onChange={(e: any) => setAgents(e.target.value)}
                        label="Tags"
                      >
                        {agentList.length > 0 &&
                          agentList.map((item: any, index: number) => (
                            <MenuItem key={index} value={item?._id || item?.id}>
                              {item.name}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <ColorSchemeConfig
                      handleBotConfigColor={handleBotConfigColor}
                    />
                  </Grid>

                  <Grid item xs={7}>
                    <Box
                      sx={{
                        gap: 5,
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '10px',
                      }}
                    >
                      <Link href="/bots/settings/">
                        <Button
                          type="submit"
                          variant="contained"
                          size="large"
                          onClick={(e: any) => handleSubmit(e)}
                        >
                          Get Started!
                        </Button>
                      </Link>

                      {/* <Connections data={data as ConnectionsTabType[]} /> */}
                    </Box>
                  </Grid>
                  <br />
                </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={4}>
          <Preview 
            botName={name}
            headerBgColor={selectedColor}
            primaryColor={selectedColor}
            top={20}
          />
          {/* headerBgColor={primaryColor} headerTextColor={primaryColor} primaryColor={primaryColor} 
        primaryTextColor={primaryColor} buttonColor={primaryColor} buttonTextColor={primaryColor} */}
        </Grid>
      </Grid>
    </div>
  );
}

export default CreateBot;
