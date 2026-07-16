// ** React Imports
import React, { useState, useEffect } from 'react';

// ** MUI Imports
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Zoom from '@mui/material/Zoom';
import TextField from '@mui/material/TextField';
import Menu from '@mui/material/Menu';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';

// ** Icon Imports
import Icon from 'src/@core/components/icon';
import { styled } from '@mui/material/styles';
import Chip from '@mui/material/Chip';
import { Paper } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from 'src/store';
import { CommonAttributeList, CustomAttributeDialog } from './Common';

const ListItems = styled('li')(({ theme }) => ({
  margin: theme.spacing(0.5),
}));
const keywordsToottip = `Keywords is a matching system in ChatBot. It works great when you want a unique phrase or a word to trigger a bot response.`;
const userSaysToottip = `User says is a matching system in ChatBot. This system analyzes the full user query to pair it with the engage bot response that matches the best.`;

type BotFAQUserInputProps = {
  groupList: any,
  setGroupList: any,
  grpIndex: number,
  keyIndex: number
};

const BotFAQUserInputEditor = (props: BotFAQUserInputProps) => {
  const { groupList, setGroupList, grpIndex, keyIndex } = props;

  const [keywordsNew, setKeywordsNew] = useState<string>('');
  const [entityList, setEntityList] = useState<any>([]);

  const embed: any = useSelector((state: RootState) => state.flow.embed);

  useEffect(() => {
    if (embed?.validationList) {
      setEntityList(embed?.validationList);
    }
  }, [embed])

  const handleDelete = (deleteData: string) => () => {
    let grpList:any = [...groupList];
    let grpArray:any = {...groupList[grpIndex]};
    let list:any = [...groupList[grpIndex].elements];
    let array:any = {...groupList[grpIndex].elements[keyIndex]};
    let values = [...groupList[grpIndex].elements[keyIndex]?.keywords];
    array.keywords = values.filter(val => val!==deleteData);
    list[keyIndex] = array;
    grpArray.elements = list;
    grpList[grpIndex] = grpArray;
    setGroupList(grpList);
  };

  function handleChangeUtterances(i: number, event: any) {
    event.preventDefault();
    let grpList:any = [...groupList];
    let grpArray:any = {...groupList[grpIndex]};
    let list:any = [...groupList[grpIndex].elements];
    let array:any = {...groupList[grpIndex].elements[keyIndex]};
    let values = [...groupList[grpIndex].elements[keyIndex]?.utterance];
    values[i] = event.target.value;
    array.utterance = values
    if (groupList[grpIndex].elements[keyIndex]?.utterance.length === i + 1) {
      array.utterance= [...array.utterance,'']
    }
    list[keyIndex]=array
    grpArray.elements = list;
    grpList[grpIndex] = grpArray;
    setGroupList(grpList);
  }

  function handleUtteranceRemove(deleteData: string) {
    let grpList:any = [...groupList];
    let grpArray:any = {...groupList[grpIndex]};
    let list:any = [...groupList[grpIndex].elements];
    let array:any = {...groupList[grpIndex].elements[keyIndex]};
    let values = [...groupList[grpIndex].elements[keyIndex]?.utterance];
    if (groupList[grpIndex]?.elements[keyIndex]?.utterance.length > 1) {
      array.utterance = values.filter(val => val!==deleteData);
      list[keyIndex]=array
      grpArray.elements = list;
      grpList[grpIndex] = grpArray;
      setGroupList(grpList);
    }
  }

  // ``````````````````````````````````````````
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClickListItem = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleEntity = (
    event: React.MouseEvent<HTMLElement>,
    entity: string,
  ) => {
    let grpList:any = [...groupList];
    let grpArray:any = {...groupList[grpIndex]};
    let list:any = [...groupList[grpIndex].elements];
    let array:any = {...groupList[grpIndex].elements[keyIndex]};
    let values = {...groupList[grpIndex].elements[keyIndex]?.userInput};
    values.entity = entity;
    array.userInput=values;
    list[keyIndex]=array;
    grpArray.elements = list;
    grpList[grpIndex] = grpArray;
    setGroupList(grpList);
    setAnchorEl(null);
  };
  const [openModal, setOpenModal] = React.useState(false);

  const handleClickOpen = () => {
    setOpenModal(true);
  };
  const saveState = (e: any) => {
    let alias = e.target.value;
    let grpList:any = [...groupList];
    let grpArray:any = {...groupList[grpIndex]};
    let list:any = [...groupList[grpIndex].elements];
    let array:any = {...groupList[grpIndex].elements[keyIndex]};
    let values = {...groupList[grpIndex]?.elements[keyIndex]?.userInput};
    values.alias = alias;
    array.userInput=values;
    list[keyIndex]=array;
    grpArray.elements = list;
    grpList[grpIndex] = grpArray;
    setGroupList(grpList);
  };
  const handleCloseModal = () => {
    saveState({ target: { value:' ' }});
    setAnchorMenuEl(null);
    setOpenModal(false);
  };
  const handleSaveCloseModal = () => {
    setAnchorMenuEl(null);
    setOpenModal(false);
  };

  //   Common Attribute list
  const [anchorMenuEl, setAnchorMenuEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorMenuEl);
  const handleClickOpenMenuAttribute = (
    event: React.MouseEvent<HTMLElement>,
  ) => {
    setAnchorMenuEl(event.currentTarget);
  };
  const handleCloseMenuAttibute = () => {
    setAnchorMenuEl(null);
  };
  const handleSelectAttributeName = (
    event: React.MouseEvent<HTMLElement>,
    alias: string,
  ) => {
    let grpList:any = [...groupList];
    let grpArray:any = {...groupList[grpIndex]};
    let list:any = [...groupList[grpIndex].elements];
    let array:any = {...groupList[grpIndex].elements[keyIndex]};
    let values = {...groupList[grpIndex]?.elements[keyIndex]?.userInput};
    values.alias = alias;
    array.userInput=values;
    list[keyIndex]=array;
    grpArray.elements = list;
    grpList[grpIndex] = grpArray;
    setGroupList(grpList);
    setAnchorMenuEl(null);
  };
  // `````````````````````````````````````````````
  return (
    <div style={{ minWidth: '350px' }}>
      <div
        className="bot-sub-title"
        style={{
          display: 'flex',
          alignContent: 'center',
          alignItems: 'center',
        }}
      >
        <Tooltip placement='left' TransitionComponent={Zoom} title={keywordsToottip} arrow>
          <IconButton>
            <Icon fontSize={18} icon="ant-design:question-circle-outlined" />
          </IconButton>
        </Tooltip>
        <span>Keywords</span>
      </div>
      <div className="setting-components">
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            flexWrap: 'wrap',
            listStyle: 'none',
            p: 0.5,
            m: 0,
            background: 'transparent'
          }}
          component="ul"
        >
          {groupList[grpIndex]?.elements[keyIndex]?.keywords.map((data:string, index:number) => {
            return (
              <ListItems key={index}>
                <Chip size="small" sx={{ fontWeight: "light" }} color='primary' label={data} onDelete={handleDelete(data)} />
              </ListItems>
            );
          })}
          <Chip
            // color='primary'
            label={
              <TextField
                sx={{ width: 90 }}
                variant="standard"
                value={keywordsNew}
                onChange={(event) => {
                  setKeywordsNew(event.target.value || '');
                }}
              />
            }
          />
          <IconButton
            onClick={() => {
              let grpList:any = [...groupList];
              let grpArray:any = {...groupList[grpIndex]};
              let list:any = [...groupList[grpIndex].elements];
              let array:any = {...groupList[grpIndex].elements[keyIndex]};
              array.keywords=[...groupList[grpIndex]?.elements[keyIndex]?.keywords, keywordsNew];
              list[keyIndex]=array
              grpArray.elements = list;
              grpList[grpIndex] = grpArray;
              setGroupList(grpList);
              setKeywordsNew('');
            }}
            disabled={keywordsNew === ''}
            color='primary'
          >
            <Icon icon="carbon:add-filled" fontSize={18} />
          </IconButton>
        </Paper>
      </div>
      <div
        className="bot-sub-title"
        style={{
          display: 'flex',
          alignContent: 'center',
          alignItems: 'center',
          marginTop: 10,
        }}
      >
        <Tooltip placement="left" TransitionComponent={Zoom} title={userSaysToottip} arrow>
          <IconButton>
            <Icon fontSize={18} icon="ant-design:question-circle-outlined" />
          </IconButton>
        </Tooltip>
        <Typography>User says</Typography>
      </div>
      <div className="setting-components">
        {groupList[grpIndex]?.elements[keyIndex]?.utterance.map((field: any, idx: number) => {
          return (
            <div
              style={{ width: "100%", margin: "0.4rem 0", position: "relative" }}
              key={idx}
            >
              <div style={{ position: "relative" }}>
                <TextField
                  style={{ width: "80%" }}

                  type="url"
                  variant="filled"

                  value={field}
                  onChange={(e: any) => handleChangeUtterances(idx, e)}
                  required
                />
                <IconButton
                  color="error"
                  sx={{ top: -15, right: "0%" }}
                  onClick={() => handleUtteranceRemove(field)}
                  disabled={groupList[grpIndex]?.elements[keyIndex]?.utterance.length<=1}
                >
                  <Icon icon="bi:trash" fontSize={20} />
                </IconButton>

                <br />
              </div>
            </div>
          );
        })}
      </div>
      <Typography
        variant="body1"
        sx={{ fontSize: '0.9rem', color: '#000', pt: 3 }}
      >Validate responses with entity <span style={{ width: '2rem' }} />{' '}
      </Typography>
      <TextField
        fullWidth
        id="setAtt"
        size="small"
        name="entity"
        onClick={handleClickListItem}
        value={groupList[grpIndex]?.elements[keyIndex]?.userInput?.entity}
      />
      <Typography
        variant="body1"
        sx={{ fontSize: '0.9rem', color: '#000', pt: 3 }}
      >
        Save response to attribute
      </Typography>
      <TextField
        fullWidth
        id="questAttMenu"
        size="small"
        onClick={handleClickOpenMenuAttribute}
        value={groupList[grpIndex]?.elements[keyIndex]?.userInput?.alias}
      />

      
      <CommonAttributeList
        handleSelectAttribute={handleSelectAttributeName}
        anchorEl={anchorMenuEl}
        open={openMenu}
        handleClose={handleCloseMenuAttibute}
        handleClickOpen={handleClickOpen}
        id="questAttMenu"
        customAttributesOption={[]}
      />

      <CustomAttributeDialog
        handleClose={handleClose}
        openModal={openModal}
        handleCloseModal={handleCloseModal}
        handleSaveCloseModal={handleSaveCloseModal}
        saveState={saveState}
      />

      <Menu
        id="setAtt"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'lock-button',
          role: 'listbox',
        }}
        sx={{ width: '100%', p: 3, height: 'auto' }}
      >
        <List
          sx={{ p: 4, height: 'auto' }}
          subheader={<ListSubheader>System Variants</ListSubheader>}
        >
          {entityList && entityList.map((entity: any, index: number) => (
            <ListItem
              sx={{ cursor: 'pointer' }}
              disablePadding
              key={index}
              onClick={(event) => handleEntity(event, entity.value)}
            >
              <ListItemText primary={entity.label}  />
            </ListItem>
          ))}
        </List>
      </Menu>
    </div>
  );
};

export default BotFAQUserInputEditor;
