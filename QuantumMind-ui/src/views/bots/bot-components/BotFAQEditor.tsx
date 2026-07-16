import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from 'src/store';
import { getNodeDetails, nodeUpdate } from 'src/store/apps/bot-flow';
import Icon from '../../../@core/components/icon';
import { Box, Chip, IconButton, Tooltip, Paper, Divider, Button, Typography, TextField, Zoom } from '@mui/material';
import BotFAQUserInputEditor from 'src/views/bots/bot-components/BotFAQUserInputEditor';
import BotFAQResponseEditor from 'src/views/bots/bot-components/BotFAQResponseEditor';
import Tab from '@mui/material/Tab';
import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';

type Props = {
  nodeId: string;
  title: string | null;
  setTitle: any;
  setOpen: any;
  divWidth: number;
  nodes: any;
};
const BotFAQEditor = (props: Props) => {
  const { nodeId: id, title, setTitle, setOpen, divWidth, nodes } = props;

  
  
  const nodeDetails: any = useSelector(
    (state: RootState) => state.flow.nodeDetails,
  );
  const dispatch = useDispatch<AppDispatch>();
  
  const [value, setValue] = useState('1');

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
      setValue(newValue);
  };

  // Grouping questions list
  const [groupList, setGroupList] = useState<any>([]); 
  // for using question with obj index
  const [grpIndex, setGrpIndex] = useState<any>(0);
  // Questions
  const [questionList, setQuestionList] = useState<any>([]);
  // switch question type
  const [faqType, setFaqType] = useState<String>("ViewQuestionList");
  // for using question user input and response with obj index
  const [keyIndex, setKeyIndex] = useState<any>(0);
  const [selectedQuestion, setSelectedQuestion] = useState<any>('');
  // bot response
  const [botResponseList, setBotResponseList] = useState<any>([]);

  const addGroupFields = () => {
    let lastGrpField = groupList[groupList.length - 1];
    let newGrpFieldsId = groupList.length===0 ? 1 : lastGrpField?.id+1
    let addGrpField = {
        id: newGrpFieldsId,
        name: "Group Name",
        elements: []
    };
    setGroupList([...groupList, addGrpField]);
  };
  const addQuestionFieldsInGrp = () => {
    let lastGrpField = groupList[groupList.length - 1];
    let newGrpFieldsId = groupList.length===0 ? 1 : lastGrpField?.id+1
    let addField = { 
        id: 1, 
        keywords:[],
        utterance:[""],
        userInput: {
          alias:'',
          entity:''
        },
        botResponse:[] 
    };
    let addGrpField = {
        id: newGrpFieldsId,
        name: "Group Name",
        elements: [addField]
    };
    setSelectedQuestion(addField);
    setKeyIndex(0);
    setBotResponseList([]);
    setFaqType('AlterQuestionList');
    setGrpIndex(0);
    setGroupList([...groupList, addGrpField]);
  };
  const addQuestionFields = (ixv:number) => {
      let grpList:any = [...groupList];
      let array:any = {...groupList[ixv]};
      let list:any = [...groupList[ixv].elements];
      let lastField = list[list.length - 1];
      let newFieldsId = list.length===0 ? 1 : lastField?.id+1
      let addField = { 
          id: newFieldsId, 
          keywords:[],
          utterance:[""],
          userInput: {
            alias:'',
            entity:''
          },
          botResponse:[] 
      };
      setSelectedQuestion(addField);
      let indexValue = [...list, addField].length-1
      setKeyIndex(indexValue);
      setGrpIndex(ixv);
      setBotResponseList([]);
      setValue('1');
      setFaqType('AlterQuestionList');
      array.elements = [...list, addField]
      grpList[ixv] = array;
      setGroupList(grpList);
  };
  const removeGrpField = (id:number) => {
    setGroupList(groupList.filter((field:any) => field.id !== id))
  };
  const removeQuestionFields = (ixv:number,id:number) => {
    let grpList:any = [...groupList];
    let array:any = {...groupList[ixv]};
    let list:any = [...groupList[ixv].elements];
    const ele = list.filter((field:any) => field.id !== id)
    array.elements = [...ele];
    grpList[ixv] = array;
    setGroupList(grpList);
  };

  const goAlterQuestion = (ixv:number,obj:any,index:any) => {
      setSelectedQuestion(obj);
      setGrpIndex(ixv);
      setKeyIndex(index);
      setValue('1');
      const list = groupList[ixv].elements[index].botResponse;
      setBotResponseList(list);
      setFaqType('AlterQuestionList');
  }

  const goBack = () => {
      setSelectedQuestion('');
      setKeyIndex(0);
      setGrpIndex(0);
      setBotResponseList([]);
      setFaqType("ViewQuestionList");
  };

  function QuestionContent() {
    return (<Box sx={{ typography: 'body1' }}>
        <TabContext value={value}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <TabList onChange={handleChange} aria-label="lab API tabs example">
                    <Tab sx={{ textTransform: "capitalize" }} label="User Input" value="1" />
                    <Tab sx={{ textTransform: "capitalize" }} label="Bot Response" value="2" />
                </TabList>
            </Box>
            <TabPanel sx={{ width: 'auto', typography: 'body1' }} value="1">
                <BotFAQUserInputEditor {...props} groupList={groupList} setGroupList={setGroupList} grpIndex={grpIndex} keyIndex={keyIndex}/>
            </TabPanel>
            <TabPanel sx={{ width: 'auto', typography: 'body1' }} value="2">
                <BotFAQResponseEditor {...props} 
                    divWidth={divWidth}  
                    botResponseList={botResponseList}
                    setBotResponseList={setBotResponseList}
                    keyIndex={keyIndex}
                    grpIndex={grpIndex}
                    nodes={nodes}
                />
            </TabPanel>
        </TabContext>
    </Box>);
  }

  function handleQuestionName(ixv:number, obj:any, index:any) {
    if (obj?.utterance && obj?.utterance.length > 0 && obj?.utterance[0]!=='') {
        return(
            <div
                style={{
                    display : 'flex',
                    backgroundColor:'#dcdcdc',
                    border : '1px solid #dcdcdc',
                    borderRadius: '4px',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                }}
            >
                <Typography variant='body1' sx={{ pl:1 }}>
                    {obj?.utterance[0]}
                </Typography>
                <IconButton color='primary' onClick={(e:any) => {
                    e.stopPropagation();
                    goAlterQuestion(ixv,obj,index)
                }}>
                    <Icon 
                        color='primary'
                        icon='material-symbols:chevron-right-rounded' 
                        fontSize={20}
                    />
                </IconButton>
            </div>
        );
    } else if (obj?.keywords && obj?.keywords.length > 0) {
        return(
            <div
                style={{
                    display : 'flex',
                    backgroundColor:'#fff',
                    border : '1px dashed #dcdcdc',
                    borderRadius: '4px',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                }}
            >
                <Chip label={obj?.keywords[0]} size='small' color='primary' sx={{ ml:1 }}/>
                <IconButton color='primary' onClick={(e:any) => {
                    e.stopPropagation();
                    goAlterQuestion(ixv,obj,index)
                }}>
                    <Icon 
                        color='primary'
                        icon='material-symbols:chevron-right-rounded' 
                        fontSize={20}
                    />
                </IconButton>
            </div>
        );
    } else {
        return(
            <div
                style={{
                    display : 'flex',
                    backgroundColor:'#fff',
                    border : '1px dashed #dcdcdc',
                    borderRadius: '4px',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                }}
            >
                <Typography variant='body1' sx={{ pl:1 }}>
                    This question is empty
                </Typography>
                <IconButton color='primary' onClick={(e:any) => {
                    e.stopPropagation();
                    goAlterQuestion(ixv,obj,index)
                }}>
                    <Icon 
                        color='primary'
                        icon='material-symbols:chevron-right-rounded' 
                        fontSize={20}
                    />
                </IconButton>
            </div>
        );
    }
  }
  
//   gets nodeDetails list of questions
  useEffect(() => {
    if (id) {
      dispatch(getNodeDetails(id));
    }
  }, [dispatch, id]);
  useEffect(() => {
      if (nodeDetails?.id) {
          setTitle('');
          if (nodeDetails?.title?.length > 0) {
            setTitle(nodeDetails?.title);
          }
      setGroupList(nodeDetails?.payload?.groups || []);
    }
  }, [nodeDetails]);
  
  const handleSubmit = (e: any) => {
    e.preventDefault();
    dispatch(
      nodeUpdate({
        id,
        title,
        payload: {
            groups:groupList
        },
      }),
    );
    setOpen(false);
  };

  useEffect(() => {
    if(botResponseList.length > 0) {
      let grpList = [...groupList];
      let grpArray:any = {...groupList[grpIndex]};
      let list = [...groupList[grpIndex].elements];
      let array = {...list[keyIndex]};
      array.botResponse = botResponseList
      list[keyIndex] = array;
      grpArray.elements = list;
      grpList[grpIndex] = grpArray;
      setGroupList(grpList);
    }
  }, [botResponseList]);

  return (
    <div style={{ minWidth: '350px' }}>
      <IconButton
        aria-label="save"
        onClick={handleSubmit}
        color="success"
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (theme) => theme.palette.success.main,
        }}
      >
        <Icon fontSize={24} icon="bi:check-lg" />
      </IconButton>

      {groupList && groupList.length > 0? (
            <>
            {selectedQuestion==='' && faqType==='ViewQuestionList' ? (
                <>
                {groupList?.map((grp: any, ixv:number) => {
                    return (
                        <Paper sx={{ m:3, p:3}}>
                        <div
                            key={ixv}
                            style={{
                            display: 'flex',
                            flexDirection:'column',
                            justifyContent:'center',
                            }}
                        >
                            <div style={{ padding:'5px 5px 15px' }}>
                                <TextField
                                    variant="standard"
                                    value={grp.name}
                                    placeholder='Group Name'
                                    onChange={(e: any) => {
                                        let list:any = [...groupList];
                                        let array:any = {...groupList[ixv]};
                                        array.name = e.target.value;
                                        list[ixv] = array;
                                        setGroupList(list);
                                    }}
                                /> 
                                <IconButton 
                                    color='primary' 
                                    size='small' 
                                    onClick={() => removeGrpField(grp.id)}
                                >
                                    <Icon icon='bi:trash' fontSize={20} />
                                </IconButton>
                            </div>
                            {grp?.elements.map((item: any, index: number) => {
                                return (
                                    <div
                                        key={index}
                                        style={{
                                            display : 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding:'5px'
                                        }}
                                    >
                                        {handleQuestionName(ixv, item, index)}
                                        <IconButton color='primary' size='small' onClick={() => removeQuestionFields(ixv,item.id)}>
                                            <Icon icon='bi:trash' fontSize={20} />
                                        </IconButton>
                                    </div>
                                );
                            })}
                            <Divider>
                                <Tooltip TransitionComponent={Zoom} title="Add Question" placement='bottom' arrow>
                                    <IconButton color='primary' onClick={()=>addQuestionFields(ixv)}>
                                        <Icon icon='carbon:add-filled' fontSize={24} />
                                    </IconButton>
                                </Tooltip>
                            </Divider>
                        </div>
                        </Paper>
                    );
                })}
                
                <Divider>
                    <IconButton color='primary' onClick={()=>addGroupFields()}>
                        <Icon icon='carbon:add-filled' fontSize={24} />
                    </IconButton>
                </Divider>
                <div style={{ textAlign:'center' }}>Add Group</div>
                </>
            ) : (
                <div>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                    }}>
                        <Button 
                            onClick={()=>goBack()} 
                            startIcon={<Icon icon='material-symbols:arrow-back-ios-new-rounded' fontSize={20}/>}
                        >go back</Button>
                    </div>
                    {QuestionContent()}
                </div>
            )}
            </> 
        ):(
            <Paper style={{ textAlign:'center',fontSize:'14px',padding:'2rem 1rem' }}>
                <Icon icon='ph:chats-fill' fontSize={50} />
                <p>Add common user questions to your<br/> Story and create your responses.</p>
                <Button 
                    variant='contained'
                    size='small'
                    onClick={()=>addQuestionFieldsInGrp()}
                >Add question</Button>
            </Paper>
        )}

    </div>
  );
};

export default BotFAQEditor;
