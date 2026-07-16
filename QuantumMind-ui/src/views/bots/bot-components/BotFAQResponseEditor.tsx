// ** React Imports
import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import IconButton from '@mui/material/IconButton';
import Icon from 'src/@core/components/icon';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { Chip, makeStyles, Paper, Stack } from '@mui/material';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import { toast } from 'react-hot-toast';
import Axios from 'src/helper/Axios';
import { useSelector } from 'react-redux';
import { RootState } from 'src/store';
import ButtonGroup from '@mui/material/ButtonGroup';
import { Tooltip } from '@mui/material';
import env from 'src/configs/environments';
type TabPanelProps = {
  children?: React.ReactNode;
  index: number;
  value: number;
};

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

type BotFAQResponseProps = {
  divWidth: number;
  grpIndex: number;
  keyIndex: any;
  botResponseList: any;
  setBotResponseList: any;
  nodes: any;
};

const BotFAQResponseEditor = (props: BotFAQResponseProps) => {
  const {
    grpIndex,
    keyIndex,
    divWidth,
    botResponseList,
    setBotResponseList,
    nodes
  } = props;

  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null,
  );

  const [buttonQR, setButtonQR] = useState<boolean>(false);
  const [buttonDetails, setButtonDetails] = useState<any>({});
  const [buttonIndex, setButtonIndex] = useState<number>(0);
  const [itemIndex, setItemIndex] = useState<number>(0);
  const [itemData, setItemData] = useState<any>({});
  const handleButtonPopUp = (
    e: any,
    buttonData: any,
    index: any,
    itemIdx: any,
    currentItemData: any,
  ) => {
    setAnchorEl(e.currentTarget);
    setButtonIndex(index);
    setButtonDetails(buttonData);
    setItemIndex(itemIdx);
    setItemData(currentItemData);
  };
  const handleButtonClose = () => {
    setAnchorEl(null);
  };

  const openButton = Boolean(anchorEl);
  const popupId = openButton ? 'simple-popover' : undefined;

  const [anchoractionEl, setAnchoractionEl] =
    React.useState<null | HTMLElement>(null);
  const openaction = Boolean(anchoractionEl);
  const handleactionClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchoractionEl(event.currentTarget);
  };
  const handleactionClose = () => {
    setAnchoractionEl(null);
  };

  const [value, setValue] = React.useState(0);

  const handleButtonpopChange = (
    event: React.SyntheticEvent,
    newValue: number,
  ) => {
    setValue(newValue);
  };

  function handleActiveVariant(e:any, index: number, activeVIdx:number) {
    let list = [...botResponseList];
    let array = {...botResponseList[index]};
    array.activeVariant = activeVIdx;
    list[index] = array;
    setBotResponseList(list);
  }
  function createNewVariant(e: any, prevItems: any, index:number) {
    if (prevItems?.length < 5) {
      let list = [...botResponseList];
      let array = {...botResponseList[index]};
      array.values = [...array.values, ""];
      list[index] = array;
      setBotResponseList(list);
    }
  }

  const [isImageUploaded, setIsImageUploaded] = useState(false);
  const addBotResponsesFields = (type: string) => {
    // let list: any = [...questionList];
    // let lastField = selectedQuestion?.botResponse[selectedQuestion?.botResponse.length - 1];
    // let newFieldsId = selectedQuestion.length === 0 ? 1 : lastField?.id + 1;
    // let addField = { id: newFieldsId, type: type, buttons: [] };
    // list[keyIndex].botResponse = [...list[keyIndex].botResponse, addField];
    // setQuestionList(list);

    let lastField = botResponseList[botResponseList.length - 1];
    let newFieldsId = botResponseList.length === 0 ? 1 : lastField?.id + 1;
    if (type === "random_text") {
      let addField = { id: newFieldsId, type: type, buttons: [], values:[""], activeVariant:0 };
      setBotResponseList([...botResponseList, addField]);
    } else {
      let addField = { id: newFieldsId, type: type, buttons: [] };
      setBotResponseList([...botResponseList, addField]);
    }
  };

  let addMultiButtonFields = (
    e: any,
    itemIndex: any,
    buttons: any,
    item: any,
  ) => {
    // buttons.push({ title: "Button", type: "text" })
    let addNewBtn = [...buttons, { title: 'Button', type: 'text' }];
    let newList = [...botResponseList];
    newList[itemIndex] = { ...item, buttons: addNewBtn };
    setBotResponseList(newList);
    setIsImageUploaded((pre) => !pre);
  };

  const removeBotResponsesFields = (id: number) => {
    setBotResponseList(botResponseList.filter((field: any) => field.id !== id));
  };

  const handleUpdateBotResponseList = (
    e: any,
    index: number,
    type: string,
    data: any,
  ) => {
    let list: any = [...botResponseList];
    if (
      type === 'text' ||
      type === 'buttons' ||
      type === 'quick_reply'
    ) {
      list[index] = { ...data, value: e.target.value, type };
      setBotResponseList(list);
    } else if (type === 'random_text') {
      list[index] = { ...data, type };
      setBotResponseList(list);
    }
    setIsImageUploaded((pre) => !pre);
  };
  const handleUploadImage = async (
    e: any,
    index: number,
    type: string,
    data: any,
  ) => {
    var file = e.target.files[0];
    const imageUrl = await uploadFileServer(e, file);
    let list: any = [...botResponseList];

    if (type === 'image') {
      list[index] = {
        ...data,
        value: `${env.baseurl}/api${imageUrl}`,
        type,
      };
      setBotResponseList(list);
    }
    setIsImageUploaded((pre) => !pre);
  };

  const uploadFileServer = async (e: any, file: any) => {
    if (file.size > 2240032) {
      toast.error('Try to upload less than 2MB');
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
  useEffect(() => {
    setBotResponseList(botResponseList);
  }, [isImageUploaded]);

  const addButtonDetails = (e: any) => {
    let btnDetails = { ...buttonDetails, [e.target.name]: e.target.value };
    setButtonDetails(btnDetails);
    let list: any = [...botResponseList];
    let updatedButtonDetails: any = [...itemData.buttons];
    updatedButtonDetails[buttonIndex] = btnDetails;
    setItemData({ ...itemData, buttons: updatedButtonDetails });
    list[itemIndex] = { ...itemData, buttons: updatedButtonDetails };
    setBotResponseList(list);
    setIsImageUploaded((pre) => !pre);
  };
  const handleDeleteButton = (
    e: any,
    buttonData: any,
    index: any,
    itemIdx: any,
    currentItemData: any,
  ) => {
    let list: any = [...botResponseList];
    list[itemIdx].buttons.splice(index, 1);
    setBotResponseList(list);
  };

  const removeRandomValueFields = (
    index: any,
    listIdx: any,
  ) => {
    let list: any = [...botResponseList];
    list[index].values.splice(listIdx, 1);
    if (listIdx === 0) {
      list[index].activeVariant = listIdx
    } else {
      list[index].activeVariant = listIdx-1
    }
    setBotResponseList(list);
  };

  return (
    <div style={{ width: '370px', minHeight: '180px' }}>
      {/* <div
          style={{
            // paddingRight: '25px',
            // paddingLeft: '25px',
            maxHeight: '60vh',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        > */}
      {botResponseList && botResponseList.length > 0 ? (
        <>
          {botResponseList &&
            botResponseList.map((item: any, index: number) => {
              if (item.type == 'text') {
                return (
                  <div style={{ padding: '0.5rem' }} key={index}>
                    <div style={{ display: 'flex', padding: '5px' }}>
                      <TextField
                        // fullWidth
                        sx={{ width: 300 }}
                        id="filled-basic"
                        variant="filled"
                        value={item.value}
                        onChange={(e: any) =>
                          handleUpdateBotResponseList(e, index, 'text', item)
                        }
                      />
                      <div
                        style={{
                          position: 'relative',
                          display: 'inline-block',
                          right: '0%',
                          top: '0%',
                        }}
                      >
                        <IconButton
                          onClick={() => removeBotResponsesFields(item.id)}
                          color="error"
                        >
                          <Icon icon="bi:trash" fontSize={18} color="#00a7ff" />
                        </IconButton>
                      </div>
                    </div>
                  </div>
                );
              } else if (item.type == 'random_text') {
                return (
                  <div style={{ padding: '0.5rem' }} key={index}>
                    <div style={{ display:'flex', }}>
                      <Typography variant="body1" sx={{ fontSize: '0.9rem', color: '#000', padding: '0px 5px', width:'300px' }}>
                        Variants {" "}
                        {item.values && item.values.map((itemVal: number, idex: number) => (
                          <Chip
                            size="small"
                            key={idex}
                            onClick={(e: any) => {handleActiveVariant(e, index, idex)}}
                            color={item.activeVariant === idex ? 'primary' : 'default'}
                            sx={{ fontWeight: 'bold', p: 0 }}
                            label={idex+1}
                          />
                        ))}
                        <IconButton
                          color="primary"
                          aria-label="Add"
                          onClick={(e: any) => {createNewVariant(e, item.values, index)}}
                        >
                          <Icon icon="carbon:add-filled" fontSize={24} />
                        </IconButton>
                      </Typography>
                      <div
                        style={{
                          position: 'relative',
                          display: 'inline-block',
                          right: '-5px',
                          top: '0',
                        }}
                      >
                        <IconButton
                          onClick={() => {removeBotResponsesFields(item.id)}}
                          color="error"
                        >
                          <Icon icon="bi:trash" fontSize={18} color="#00a7ff" />
                        </IconButton>
                      </div>
                    </div>
                    <div style={{ display: 'flex', padding: '5px' }}>
                      <TextField
                        // fullWidth
                        sx={{ width: 300 }}
                        id="filled-basic"
                        variant="filled"
                        value={item?.values[item.activeVariant]}
                        onChange={(e: any) => {
                          let itemArray = {...item};
                          let valuesList = [...item.values];
                          valuesList[item.activeVariant] = e.target.value;
                          itemArray.values = valuesList;
                          handleUpdateBotResponseList(
                            e,
                            index,
                            'random_text',
                            itemArray,
                          )
                        }}
                      />
                      <div
                        style={{
                          position: 'relative',
                          display: 'inline-block',
                          right: '25px',
                          top: '-6px',
                        }}
                      >
                        <IconButton
                          disabled={item?.values?.length <= 1}
                          onClick={() => removeRandomValueFields(index, item.activeVariant)}
                          color="primary"
                        >
                          <Icon icon="bi:trash" fontSize={16} />
                        </IconButton>
                      </div>
                    </div>
                    
                  </div>
                );
              } else if (item.type == 'image') {
                return (
                  <div style={{ padding: '0.5rem' }} key={index}>
                    <div style={{ display: 'flex', padding: '5px' }}>
                      <Button
                        variant="contained"
                        component="label"
                        style={{ width: 300, height: 250 }}
                        sx={{ bgcolor: '#A2A2A2' }}
                      >
                        <div
                          style={{
                            backgroundImage: `url(${item.value})`,
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center center',
                            width: 300,
                            height: 250,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',

                              alignItems: 'center',
                              width: 300,
                              height: 250,
                            }}
                          >
                            <Icon icon="bx:camera" />
                            <span>Upload Photo</span>
                            <input
                              hidden
                              accept="image/*"
                              onChange={(e: any) =>
                                handleUploadImage(e, index, 'image', item)
                              }
                              multiple
                              type="file"
                            />
                          </div>
                        </div>
                      </Button>
                      <div
                        style={{
                          position: 'relative',
                          display: 'inline-block',
                          top: 0,
                          right: 0,
                        }}
                      >
                        <IconButton
                          className="button remove"
                          onClick={() => removeBotResponsesFields(item.id)}
                          color="error"
                        >
                          <Icon icon="bi:trash" fontSize={18} color="#00a7ff" />
                        </IconButton>
                      </div>
                    </div>
                  </div>
                );
              } else if (item.type == 'buttons') {
                return (
                  <div style={{ padding: '0.5rem' }} key={index}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '5px',
                      }}
                    >
                      <div
                        style={{
                          display: 'inline-flex',
                          justifyContent: 'flex-start',
                        }}
                      >
                        <TextField
                          fullWidth
                          label="Enter Your Message...."
                          id="fullWidth"
                          name="name"
                          value={item.value}
                          onChange={(e: any) =>
                            handleUpdateBotResponseList(
                              e,
                              index,
                              'buttons',
                              item,
                            )
                          }
                          multiline
                          rows={4}
                          style={{ width: 300 }}
                        />
                        <div
                          style={{
                            position: 'relative',
                            display: 'inline-block',
                            top: 0,
                            right: 0,
                          }}
                        >
                          <IconButton
                            className="button remove"
                            onClick={() => removeBotResponsesFields(item.id)}
                            color="error"
                          >
                            <Icon
                              icon="bi:trash"
                              fontSize={18}
                              color="#00a7ff"
                            />
                          </IconButton>
                        </div>
                      </div>

                      {item?.buttons &&
                        item.buttons.map((button: any, buttonIndex: number) => (
                          <ButtonGroup
                            orientation="vertical"
                            aria-label="vertical outlined button group"
                            key={buttonIndex}
                          >
                            <Button
                              variant="outlined"
                              style={{ width: 300, position: 'relative' }}
                              onClick={(e: any) => {
                                setButtonQR(false);
                                handleButtonPopUp(
                                  e,
                                  button,
                                  buttonIndex,
                                  index,
                                  item,
                                );
                              }}
                            >
                              {button.title}

                              <Tooltip title="Delete Button" arrow>
                                <IconButton
                                  sx={{ position: 'absolute', right: 0 }}
                                  className="button remove"
                                  onClick={(e: any) => {
                                    e.stopPropagation();
                                    handleDeleteButton(
                                      e,
                                      button,
                                      buttonIndex,
                                      index,
                                      item,
                                    );
                                  }}
                                  color="error"
                                >
                                  <Icon
                                    icon="bi:trash"
                                    fontSize={18}
                                    color="#00a7ff"
                                  />
                                </IconButton>
                              </Tooltip>
                            </Button>
                          </ButtonGroup>
                        ))}
                      <br />
                      <div
                        style={{
                          padding: '10px 0px',
                          textAlign: 'center',
                        }}
                      >
                        <Button
                          variant="contained"
                          size="small"
                          style={{ width: 300 }}
                          sx={{
                            // borderWidth: 2,
                            backgroundColor: 'white',
                            borderRadius: 10,
                            color: 'black',
                            ml: -13,
                          }}
                          onClick={(e) =>
                            addMultiButtonFields(e, index, item.buttons, item)
                          }
                        >
                          <Icon icon="bx:plus-circle" /> Add Button
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              } else if (item.type == 'quick_reply') {
                return (
                  <div style={{ padding: '0.5rem' }} key={index}>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '5px',
                      }}
                    >
                      <div
                        style={{
                          display: 'inline-flex',
                          justifyContent: 'flex-start',
                          paddingBottom: '5px',
                        }}
                      >
                        <TextField
                          fullWidth
                          label="Enter Your Message...."
                          id="fullWidth"
                          name="message"
                          style={{ width: 300 }}
                          value={item.value}
                          onChange={(e: any) =>
                            handleUpdateBotResponseList(
                              e,
                              index,
                              'quick_reply',
                              item,
                            )
                          }
                        />
                        <div
                          style={{
                            position: 'relative',
                            display: 'inline-block',
                            top: 0,
                            right: 0,
                          }}
                        >
                          <IconButton
                            className="button remove"
                            onClick={() => removeBotResponsesFields(item.id)}
                            color="error"
                          >
                            <Icon
                              icon="bi:trash"
                              fontSize={18}
                              color="#00a7ff"
                            />
                          </IconButton>
                        </div>
                      </div>
                      <Grid container xs={12}>
                        {item?.buttons &&
                          item.buttons.map(
                            (button: any, buttonIndex: number) => (
                              <div style={{ padding: '5px' }} key={buttonIndex}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  style={{
                                    // borderWidth: 2,
                                    borderRadius: 50,
                                  }}
                                  onClick={(e: any) => {
                                    setButtonQR(true);
                                    handleButtonPopUp(
                                      e,
                                      button,
                                      buttonIndex,
                                      index,
                                      item,
                                    );
                                  }}
                                  endIcon={
                                    <Tooltip title="Delete Button" arrow>
                                      <IconButton
                                        className="button remove"
                                        size="small"
                                        onClick={(e: any) => {
                                          e.stopPropagation();
                                          handleDeleteButton(
                                            e,
                                            button,
                                            buttonIndex,
                                            index,
                                            item,
                                          );
                                        }}
                                        color="error"
                                      >
                                        <Icon
                                          icon="bi:trash"
                                          fontSize={18}
                                          color="#00a7ff"
                                        />
                                      </IconButton>
                                    </Tooltip>
                                  }
                                >
                                  {button.title}
                                </Button>
                              </div>
                            ),
                          )}
                      </Grid>

                      <div style={{ padding: '5px' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          style={{
                            // borderWidth: 2,
                            backgroundColor: 'white',
                            borderStyle: 'dashed',
                            borderColor: 'black',
                            borderRadius: 50,
                            color: 'black',
                          }}
                          onClick={(e) =>
                            addMultiButtonFields(e, index, item.buttons, item)
                          }
                        >
                          <Icon icon="bx:plus" /> Add Button
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              }
            })}

          <Popover
            id={popupId}
            open={openButton}
            anchorEl={anchorEl}
            onClose={handleButtonClose}
            anchorOrigin={{
              vertical: 'center',
              horizontal: 'left',
            }}
            transformOrigin={{
              vertical: 'center',
              horizontal: 'right',
            }}
          >
            <Typography sx={{ p: 2, width: 400, height: 400 }}>
              <Box sx={{ width: '100%' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs
                    value={value}
                    onChange={handleButtonpopChange}
                    aria-label="basic tabs example"
                  >
                    <Tab label="General" {...a11yProps(0)} />
                    <Tab label="Actions" {...a11yProps(1)} />
                  </Tabs>
                </Box>
                <TabPanel value={value} index={0}>
                  <Grid container columnSpacing={3}>
                    <Grid item xs={12}>
                      <br />
                      <label>Button Title</label>
                      <TextField
                        fullWidth
                        id="outlined-size-normal"
                        name="title"
                        size="small"
                        defaultValue={buttonDetails.title}
                        onChange={addButtonDetails}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <br />
                    </Grid>
                    <Grid item xs={12}>
                      <label>Button Type</label>
                      <FormControl fullWidth>
                        <Select
                          id="demo-simple-select"
                          value={buttonDetails.type}
                          name="type"
                          size="small"
                          onChange={addButtonDetails}
                        >
                          <MenuItem value={'text'}>Send Message</MenuItem>
                          <MenuItem value={'goto'}>Go To Block</MenuItem>
                          {!buttonQR && (
                            <MenuItem value={'url'}>Open URL</MenuItem>
                          )}
                          {!buttonQR && (
                            <MenuItem value={'phone'}>Phone Call</MenuItem>
                          )}
                          {!buttonQR && (
                            <MenuItem value={'moment'}>Open Moment</MenuItem>
                          )}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <br />
                    </Grid>
                    <Grid item xs={12}>
                      {buttonDetails.type == 'text' && (
                        <TextField
                          size="small"
                          fullWidth
                          label="Add Text message"
                          value={buttonDetails.value}
                          onChange={addButtonDetails}
                          name="value"
                        />
                      )}
                      {buttonDetails.type == 'url' && (
                        <TextField
                          size="small"
                          fullWidth
                          label="Add URL"
                          value={buttonDetails.value}
                          onChange={addButtonDetails}
                          name="value"
                        />
                      )}
                      {buttonDetails.type == 'phone' && (
                        <TextField
                          size="small"
                          fullWidth
                          label="Add Phone Number"
                          value={buttonDetails.value}
                          onChange={addButtonDetails}
                          name="value"
                        />
                      )}
                      {buttonDetails.type == 'moment' && (
                        <TextField
                          size="small"
                          fullWidth
                          label="Add URL"
                          value={buttonDetails.value}
                          onChange={addButtonDetails}
                          name="value"
                        />
                      )}
                      {buttonDetails.type == 'goto' && (
                        <FormControl fullWidth>
                          <InputLabel id="demo-goto-select-label">
                            Add Goto block
                          </InputLabel>
                          <Select
                            labelId="demo-goto-select-label"
                            id="demo-goto-select"
                            value={buttonDetails.value}
                            name="value"
                            size="small"
                            label="Add Goto block"
                            onChange={addButtonDetails}
                          >
                            {nodes?.length > 0 &&
                              nodes.map((node: any, index: any) => (
                                <MenuItem key={index} value={node.id}>
                                  {node?.data?.title}
                                </MenuItem>
                              ))}
                          </Select>
                        </FormControl>
                      )}
                    </Grid>
                    <Grid item xs={12}>
                      <br />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        size="small"
                        fullWidth
                        variant="contained"
                        component="label"
                        onClick={handleButtonClose}
                      >
                        Save Settings
                      </Button>
                    </Grid>
                  </Grid>
                </TabPanel>
                <TabPanel value={value} index={1}>
                  <Grid container columnSpacing={3}>
                    <Grid item xs={12}>
                      <Button
                        id="basic-button"
                        aria-controls={openaction ? 'basic-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={openaction ? 'true' : undefined}
                        style={{
                          borderWidth: 2,
                          borderStyle: 'dashed',
                          borderColor: 'blue',
                          borderTopColor: 'blue',
                          borderRadius: 50,
                        }}
                        fullWidth
                        size="small"
                        onClick={handleactionClick}
                      >
                        <b>+ Add New Action</b>
                      </Button>
                      <Menu
                        id="basic-menu"
                        anchorEl={anchoractionEl}
                        open={openaction}
                        onClose={handleactionClose}
                        MenuListProps={{
                          'aria-labelledby': 'basic-button',
                        }}
                      >
                        <MenuItem onClick={handleactionClose}>
                          <Grid item xs={12} sm={2}>
                            <Icon icon="bx:pie-chart-alt" />
                          </Grid>
                          <Grid item xs={12} sm={8}>
                            Add To Segment
                          </Grid>
                        </MenuItem>
                        <MenuItem onClick={handleactionClose}>
                          <Grid item xs={12} sm={2}>
                            <Icon icon="bx:pie-chart" />
                          </Grid>
                          <Grid item xs={12} sm={8}>
                            Remove From Segment
                          </Grid>
                        </MenuItem>
                        <MenuItem onClick={handleactionClose}>
                          <Grid item xs={12} sm={2}>
                            <Icon icon="bx:dots-horizontal-rounded" />
                          </Grid>
                          <Grid item xs={12} sm={8}>
                            Set Custom Attribute
                          </Grid>
                        </MenuItem>
                      </Menu>
                    </Grid>
                    <Grid item xs={12}>
                      <br />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        size="small"
                        fullWidth
                        variant="contained"
                        component="label"
                      >
                        Save Settings
                      </Button>
                    </Grid>
                  </Grid>
                </TabPanel>
              </Box>
            </Typography>
          </Popover>
        </>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '13px', padding: '3.5rem 0rem' }}>
            In the menu on the left-hand side, you can select a response
            <br />
            you want to send to users.
          </p>
        </div>
      )}
      {/* </div> */}

      <Box
        style={{
          position: 'fixed',
          top: 10,
          right: `${divWidth + 28}px`,
        }}
      >
        <React.Fragment>
          <Paper
            sx={{
              bgcolor: '#ffffff',
              width: 210,
              padding: '15px',
              alignItems: 'center',
            }}
          >
            <Grid container columnSpacing={3} sx={{ color: '#000' }}>
              <Grid item xs={12}>
                <label style={{ fontSize: 16, textAlign: 'center' }}>
                  <b>Responses</b>
                </label>
              </Grid>
              <Grid item xs={12} sm={6} sx={{ pt: 2, textAlign: 'center' }}>
                <Button
                  sx={{ width: 80, height: 60, border: '1px solid lightgrey' }}
                  onClick={() => {
                    addBotResponsesFields('text');
                  }}
                >
                  <Icon icon="bx:text" fontSize={25} color="#59687b" />
                </Button>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    color: '#59687b',
                  }}
                >
                  Text
                </div>
              </Grid>

              <Grid item xs={12} sm={6} sx={{ pt: 2, textAlign: 'center' }}>
                <Button
                  sx={{ width: 80, height: 60, border: '1px solid lightgrey' }}
                  onClick={() => {
                    addBotResponsesFields('random_text');
                  }}
                >
                  <Icon icon="mdi:letters" fontSize={25} color="#59687b" />
                </Button>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    color: '#59687b',
                  }}
                >
                  Random Text
                </div>
              </Grid>
              <Grid item xs={12} sm={6} sx={{ pt: 2, textAlign: 'center' }}>
                <Button
                  sx={{ width: 80, height: 60, border: '1px solid lightgrey' }}
                  onClick={() => {
                    addBotResponsesFields('image');
                  }}
                >
                  <Icon icon="bx:image" fontSize={25} color="#59687b" />
                </Button>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    color: '#59687b',
                  }}
                >
                  Image
                </div>
              </Grid>
              <Grid item xs={12} sm={6} sx={{ pt: 2, textAlign: 'center' }}>
                <Stack
                  direction="column"
                  alignItems="center"
                  justifyContent="flex-start"
                >
                  <Button
                    sx={{
                      width: 80,
                      height: 60,
                      border: '1px solid lightgrey',
                    }}
                    onClick={() => {
                      addBotResponsesFields('quick_reply');
                    }}
                  >
                    <Icon icon="bx:edit" fontSize={25} color="#59687b" />
                  </Button>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: '500',
                      color: '#59687b',
                    }}
                  >
                    Quick Reply
                  </div>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={12} sx={{ pt: 2, textAlign: 'center' }}>
                <Button
                  sx={{ width: 80, height: 60, border: '1px solid lightgrey' }}
                  onClick={() => {
                    addBotResponsesFields('buttons');
                  }}
                >
                  <Icon
                    icon="mdi:cards-variant"
                    fontSize={25}
                    color="#59687b"
                  />
                </Button>
                <div
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    color: '#59687b',
                  }}
                >
                  Button
                </div>
              </Grid>
            </Grid>
          </Paper>
        </React.Fragment>
      </Box>
    </div>
  );
};

export default BotFAQResponseEditor;
