// ** React Imports
import React, { Fragment, useState, useEffect } from 'react';

// ** MUI Imports
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Zoom from '@mui/material/Zoom';
import TextField from '@mui/material/TextField';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';

// ** Icon Imports
// import Icon from 'src/@core/components/icon';
import Icon from '../../../@core/components/icon';
import { styled } from '@mui/material/styles';
import Chip from '@mui/material/Chip';
import { Paper, Stack, Switch } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from 'src/store';
import { getNodeDetails, nodeUpdate, updateBotFlow } from 'src/store/apps/bot-flow';
import { CommonAttributeList, CustomAttributeDialog } from './Common';
import { useRouter } from 'next/router';

const ListItems = styled('li')(({ theme }) => ({
  margin: theme.spacing(0.5),
}));
const keywordsToottip = `Keywords is a matching system in ChatBot. It works great when you want a unique phrase or a word to trigger a bot response.`;
const userSaysToottip = `User says is a matching system in ChatBot. This system analyzes the full user query to pair it with the JarCube bot response that matches the best.`;

type BotUserInputProps = {
  id: string;
  title: string | null;
  setTitle: any;
  setOpen: any;
  nodeId: string;
  forAi : boolean;
  nodes : any;
  edges : any;
  files : any
};

const BotUserInputEditor = (props: BotUserInputProps) => {
  const { nodeId: id, title, setTitle, setOpen, forAi, nodes, edges, files } = props;
  const nodeToUpdate = nodes && nodes.filter((node : any)=>{
    return node.id === id
  })
  // nodes.map((node : any)=>{
  //   return node.id === id ? {...node, fileIds : files} : node
  // })

  const [chipData, setChipData] = useState<Array<string>>([]);
  const [keywordsNew, setKeywordsNew] = useState<string>('');
  const [entity, setEntity] = useState<string>('');
  const [entityList, setEntityList] = useState<any>([]);
  const [alias, setAlias] = useState<string>('');
  const [utterances, setUtterances] = useState<any>(['']);
  const [secure, setSecure] = useState<boolean>(false);
  const [attributesList, setAttributesList] = useState<any>([]);
  const [customAttributesList, setCustomAttributesList] = useState<any>([]);
  const nodeDetails: any = useSelector(
    (state: RootState) => state.flow.nodeDetails,
  );
  const embed: any = useSelector((state: RootState) => state.flow.embed);
  const router = useRouter();
  const botId = router.query.botId;
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    if (id) {
      dispatch(getNodeDetails(id));
    }
  }, [dispatch, id]);
  useEffect(() => {
    if (embed?.validationList) {
      setEntityList(embed?.validationList);
    }
    if (embed?.attributes) {
      setAttributesList(embed?.attributes);
    }
    if (embed?.customAttributes) {
      setCustomAttributesList(embed?.customAttributes);
    }
    if (nodeDetails?.id) {
      if (nodeDetails.utterance.length > 0) {
        setUtterances(nodeDetails.utterance);
      }
      setChipData(nodeDetails.keywords);
      setTitle('');
      if (nodeDetails?.title?.length > 0) {
        setTitle(nodeDetails?.title);
      }
      setAlias(nodeDetails?.payload?.alias);
      setEntity(nodeDetails?.payload?.entity);
      setSecure(nodeDetails?.payload?.secure);
    }
  }, [embed, nodeDetails]);

  const handleDelete = (deleteIndex: number) => () => {
    setChipData((chips) =>
      chips.filter((chip, index) => index !== deleteIndex),
    );
  };
  function handleChangeUtterances(i: number, event: any) {
    const values = [...utterances];
    values[i] = event.target.value;
    setUtterances(values);
  }
  function handleUtteranceRemove(i: number) {
    if (utterances.length > 1) {
      const values = [...utterances];
      values.splice(i, 1);
      setUtterances(values);
    }
  }
  const handleSubmit = (e: any) => {
    e.preventDefault();
    const {payload} = nodeToUpdate[0]
    !forAi ? 
    dispatch(
      nodeUpdate({
        id,
        keywords: chipData,
        utterance: utterances,
        title,
        payload: {
          entity: entity,
          alias: alias,
          secure: secure,
        },
        customAttributes: [{[alias]: alias}],
      }),
    ) : dispatch(
      nodeUpdate({...nodeToUpdate[0], payload : {...payload, fileIds : files }})
    );
    setOpen(false);
  };

  // ``````````````````````````````````````````
  // const { data, index, elements, setElements } = props;
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
    setEntity(entity);
    setAnchorEl(null);
  };

  const [openModal, setOpenModal] = React.useState(false);
  const saveState = (e: any) => {
    let alias = e.target.value;
    setAlias(alias);
  };
  const handleClickOpen = () => {
    setOpenModal(true);
  };
  const handleCloseModal = () => {
    saveState({ target: { value: ' ' } });
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
    setAlias(alias);
    setAnchorMenuEl(null);
  };
  // `````````````````````````````````````````````
  const handleCreateUtterance = (index: number) => {
    const values = [...utterances];
    values.splice(index + 1, 0, '');
    setUtterances(values);
  };
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
      { !forAi && 
      <>
      <div
        className="bot-sub-title"
        style={{
          display: 'flex',
          alignContent: 'center',
          alignItems: 'center',
        }}
      >
        <Tooltip
          placement="left"
          TransitionComponent={Zoom}
          title={keywordsToottip}
          arrow
        >
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
            background: 'transparent',
          }}
          component="ul"
        >
          {chipData.map((data, index) => {
            return (
              <ListItems key={index}>
                <Chip
                  size="small"
                  sx={{ fontWeight: 'light' }}
                  color="primary"
                  label={data}
                  onDelete={handleDelete(index)}
                />
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
              setChipData([...chipData, keywordsNew]);
              setKeywordsNew('');
            }}
            disabled={keywordsNew === ''}
            color="primary"
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
        <Tooltip
          placement="left"
          TransitionComponent={Zoom}
          title={userSaysToottip}
          arrow
        >
          <IconButton>
            <Icon fontSize={18} icon="ant-design:question-circle-outlined" />
          </IconButton>
        </Tooltip>
        <Typography>User says</Typography>
      </div>
      <div className="setting-components">
        {utterances.map((field: any, idx: number) => {
          return (
            <div
              style={{
                width: '100%',
                margin: '0.4rem 0',
                position: 'relative',
              }}
              key={idx}
            >
              <Stack
                direction="row"
                justifyContent="flex-start"
                alignItems="flex-start"
                style={{ position: 'relative' }}
              >
                <TextField
                  style={{ width: '80%' }}
                  type="url"
                  variant="filled"
                  value={field}
                  onChange={(e: any) => handleChangeUtterances(idx, e)}
                  onKeyUp={(e: any) => {
                    if (e.key === 'Enter') {
                      handleCreateUtterance(idx);
                    }
                  }}
                  required
                />
                <Stack
                  direction="row"
                  justifyContent="flex-start"
                  alignItems="flex-start"
                >
                  <IconButton onClick={() => handleCreateUtterance(idx)}>
                    <Icon
                      icon="carbon:add-filled"
                      fontSize={20}
                      color="#00a7ff"
                    />
                  </IconButton>
                  <IconButton
                    color="error"
                    // sx={{ top: -15, right: '0%' }}
                    onClick={() => handleUtteranceRemove(idx)}
                  >
                    <Icon icon="bi:trash" fontSize={20} />
                  </IconButton>
                </Stack>
              </Stack>
            </div>
          );
        })}
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
        <Tooltip
          placement="left"
          TransitionComponent={Zoom}
          title={'To mask the user input'}
          arrow
        >
          <IconButton>
            <Icon fontSize={18} icon="ant-design:question-circle-outlined" />
          </IconButton>
        </Tooltip>
        <Typography>
          Mask user input
          <Switch
            checked={secure}
            onChange={(e: any) => setSecure(e.target.checked)}
          />
        </Typography>
      </div>

      <Typography
        variant="body1"
        sx={{ fontSize: '0.9rem', color: '#000', pt: 3 }}
      >
        Validate responses with entity <span style={{ width: '2rem' }} />{' '}
      </Typography>
      <TextField
        fullWidth
        id="setAtt"
        size="small"
        name="entity"
        onClick={handleClickListItem}
        value={
          entityList?.find((e: any) => e.value === entity)?.label ||
          entity ||
          ''
        }
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
        value={
          attributesList?.find((e: any) => e.value === alias)?.label ||
          customAttributesList?.find((e: any) => e.value === alias)?.label ||
          alias ||
          ''
        }
      />

      <CommonAttributeList
        handleSelectAttribute={handleSelectAttributeName}
        anchorEl={anchorMenuEl}
        open={openMenu}
        handleClose={handleCloseMenuAttibute}
        handleClickOpen={handleClickOpen}
        id="questAttMenu"
        customAttributesOption={customAttributesList}
        defaultAttributesOption={attributesList}
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
          {entityList &&
            entityList.map((entity: any, index: number) => (
              <ListItem
                sx={{ cursor: 'pointer' }}
                disablePadding
                key={index}
                onClick={(event) => handleEntity(event, entity.value)}
              >
                <ListItemText primary={entity.label} />
              </ListItem>
            ))}
        </List>
      </Menu></>
      }
    </div>
  );
};

export default BotUserInputEditor;
