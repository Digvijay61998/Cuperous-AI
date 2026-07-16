import React, { useState, useEffect } from 'react';
import {
  Paper,
  IconButton,
  Divider,
  Typography,
  Chip,
  TextField,
  Button,
  Link,
} from '@mui/material';
import Icon from 'src/@core/components/icon';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import ListItemButton from '@mui/material/ListItemButton';
import ListSubheader from '@mui/material/ListSubheader';
import ListItemIcon from '@mui/material/ListItemIcon';
import { CustomAttributeDialog, CommonAttributeList } from './Common';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from 'src/store';
import { getNodeDetails, nodeUpdate } from 'src/store/apps/bot-flow';
import { Switch } from '@mui/material';

import Select, { SelectChangeEvent } from '@mui/material/Select';
type QuestionProps = {
  index: number;
  data: any;
  handleRemoveQuestionBlock: (index: number) => void;
  handleAddElement: any;
  elements: any;
  setElements: any;
  embed: any;
};

const askTimeOptions = [
  { name: 'until filled', value: -1 },
  { name: 'once', value: 1 },
  { name: '2 times', value: 2 },
  { name: '3 times', value: 3 },
  { name: '4 times', value: 4 },
  { name: '5 times', value: 5 },
];
function QuestionCard(props: QuestionProps) {
  const { data, index, handleAddElement, elements, setElements, embed } = props;
  const [variantList, setVariantList] = useState([1]);
  const [activeVariant, setActiveVariant] = useState<any>(0);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [secure, setSecure] = useState<boolean>(false);
  const [attributesList, setAttributesList] = useState<any>([]);
  const [customAttributesList, setCustomAttributesList] = useState<any>([]);
  const open = Boolean(anchorEl);
  useEffect(() => {
    if (embed?.attributes) {
      setAttributesList(embed?.attributes);
    }
    if (embed?.customAttributes) {
      setCustomAttributesList(embed?.customAttributes);
    }
  }, [embed]);
  const handleClickListItem = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleActiveVariant = (e: any, index: number) => {
    setActiveVariant(index);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const [selectedVariant, setSelectedVariant] = useState('');
  const handleEntity = (
    event: React.MouseEvent<HTMLElement>,
    entity: string,
  ) => {
    let elementsCopy = [...elements];
    elementsCopy[index] = { ...data, entity };
    setElements([...elementsCopy]);
    setSelectedVariant(entity);
    setAnchorEl(null);
  };
  const [openModal, setOpenModal] = React.useState(false);

  const handleClickOpen = () => {
    setOpenModal(true);
  };
  const saveState = (e: any) => {
    let alias = e.target.value;
    let elementsCopy = [...elements];
    elementsCopy[index] = { ...data, alias };
    setElements([...elementsCopy]);
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
    let elementsCopy = [...elements];
    elementsCopy[index] = { ...data, alias };
    setElements([...elementsCopy]);
    setAnchorMenuEl(null);
  };
  const [actionInput, setActionInput] = useState(1);
  const handleChangeActionInput = (e: any) => {
    setActionInput(e.target.value);
  };

  // ask _times_ if user reply invalid
  const [anchorEl2, setAnchorEl2] = React.useState<null | HTMLElement>(null);
  const [askTimes, setAskTimes] = useState<any>(-1);
  const open2 = Boolean(anchorEl2);
  const handleClickListItem2 = (
    event: React.MouseEvent<HTMLElement>,
    value: number,
  ) => {
    setAskTimes(value);
    setAnchorEl2(event.currentTarget);
  };

  const handleMenuItemClick2 = (
    event: React.MouseEvent<HTMLElement>,
    value: number,
    index: number,
  ) => {
    setAskTimes(value);
    const newElements = elements.map((item: any, i: number) => {
      if (i === index) {
        return { ...item, lifespan: value };
      }
      return item;
    });
    setElements(newElements);
    setAnchorEl2(null);
  };

  const handleClose2 = () => {
    setAnchorEl2(null);
  };
  const handleGetLifeSpan = (value: number) => {
    const getName = askTimeOptions.filter((item) => item.value === value);
    if (getName.length > 0) {
      return getName[0].name;
    }
    return 'until filled';
  };

  const handleInputMask = (e: any, index: number) => {
    let elementsCopy = [...elements];
    elementsCopy[index] = { ...data, secure: e.target.checked };
    setSecure(e.target.checked);
    setElements([...elementsCopy]);
  };

  return (
    <Paper className="setting-components" sx={{ p: 2 }}>
      <Typography variant="body1" sx={{ fontSize: '0.9rem', color: '#000' }}>
        Question Variants <span style={{ width: '2rem' }} />
        {/* {variantList &&
                    variantList.map((item: number, idex: number) => (
                        <Chip
                            size="small"
                            onClick={(e: any) => handleActiveVariant(e, idex)}
                            color={activeVariant === idex ? 'primary' : 'default'}
                            sx={{ fontWeight: 'bold', p: 0 }}
                            label={item}
                        />
                    ))}
                <IconButton
                    color="primary"
                    aria-label="Add"
                    onClick={(e: any) => createNewVariant(e, variantList.length)}
                >
                    <Icon icon="carbon:add-filled" fontSize={24} />
                </IconButton> */}
      </Typography>
      <div style={{ position: 'relative' }}>
        <TextField
          fullWidth
          id="filled-basic"
          value={data.prompt}
          name="prompt"
          onChange={(e: any) => handleAddElement(e, data, index)}
          variant="filled"
        />
        {/* <div style={{ position: 'absolute', right: '-3%', top: '-20%' }}>
                    <IconButton>
                        <Icon icon="bi:trash" fontSize={18} color="red" />
                    </IconButton>
                </div> */}
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
          (props?.embed?.validationList &&
            props?.embed?.validationList.find(
              (item: any) => item.value === data.entity,
            )?.label) ||
          data.entity ||
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
          attributesList?.find((e: any) => e.value === data?.alias)?.label ||
          customAttributesList?.find((e: any) => e.value === data?.alias)?.label ||
          data?.alias ||
          ''
        }
      />
      <Typography>
        Mask user input
        <Switch
          checked={data.secure}
          onChange={(e: any) => handleInputMask(e, index)}
          inputProps={{ 'aria-label': 'controlled' }}
        />
      </Typography>

      <Typography
        variant="body1"
        sx={{ fontSize: '0.9rem', color: '#000', pt: 3 }}
      >
        Action on failure input
      </Typography>
      <Select
        fullWidth
        size="small"
        onChange={(e: any) => handleAddElement(e, data, index)}
        value={data.actionOnFailure ?? ''}
        sx={{ fontSize: '0.9rem' }}
        name="actionOnFailure"
      >
        <MenuItem sx={{ fontSize: '0.9rem' }} value="continue">
          Go to Next Question
        </MenuItem>
        <MenuItem sx={{ fontSize: '0.9rem' }} value="fallback">
          Go to Failure Block
        </MenuItem>
      </Select>
      <Typography
        variant="body1"
        sx={{ fontSize: '0.8rem', color: '#000', pt: 3 }}
      >
        Ask &nbsp;
        <Link
          component="button"
          variant="body2"
          style={{ marginTop: '-4px' }}
          onClick={(e) => handleClickListItem2(e, data.lifespan)}
        >
          {data.lifespan ? handleGetLifeSpan(data.lifespan) : 'until filled'}
        </Link>{' '}
        &nbsp; if the user reply invalid
      </Typography>

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
          {props?.embed?.validationList &&
            props?.embed?.validationList.map((entity: any, index: number) => (
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
      </Menu>

      <Menu
        id="ask-times-menu"
        anchorEl={anchorEl2}
        open={open2}
        onClose={handleClose2}
        MenuListProps={{
          'aria-labelledby': 'lock-button',
          role: 'listbox',
        }}
      >
        {askTimeOptions.map((item: any, index2: number) => (
          <MenuItem
            key={index2}
            selected={item.value === askTimes}
            onClick={(event) => handleMenuItemClick2(event, item.value, index)}
            style={{ padding: '0.3rem 1rem' }}
          >
            {item.name}
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  );
}

type Props = {
  nodeId: string;
  title: string | null;
  setTitle: any;
  setOpen: any;
};

const BotQuestionsEditor = (props: Props) => {
  const { nodeId: id, title, setTitle, setOpen } = props;
  const [elements, setElements] = useState<any>([{}]);
  const dispatch = useDispatch<AppDispatch>();
  const nodeDetails: any = useSelector(
    (state: RootState) => state.flow.nodeDetails,
  );
  const embed: any = useSelector((state: RootState) => state.flow.embed);
  useEffect(() => {
    if (id) {
      dispatch(getNodeDetails(id));
    }
  }, [dispatch, id]);
  useEffect(() => {
    if (nodeDetails?.id) {
      setElements(nodeDetails?.payload?.elements || []);
    }
    setTitle('');
    if (nodeDetails?.title?.length > 0) {
      setTitle(nodeDetails?.title);
    }
 
  }, [nodeDetails]);
  function handleRemoveQuestionBlock(index: number) {
    // setQuestionsData(prevState => prevState.filter(item => item.set!== props.set));
    if (elements.length > 1) {
      let data = [...elements];
      data.splice(index, 1);
      setElements(data);
    }
  }
  const createNewQuestionCard: any = () => {
    let values = [...elements];
    values.push({});
    setElements(values);
  };
  const handleAddElement = (e: any, element: any, index: number) => {
    let arr = [...elements];
    arr[index] = { ...element, [e.target.name]: e.target.value };
    setElements(arr);
  };
  const handleSubmit = (e: any) => {
    e.preventDefault();
    dispatch(
      nodeUpdate({
        id,
        title,
        payload: {
          elements,
        },
      }),
    );
    setOpen(false);
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
      {elements.map((element: any, index: number) => {
        return (
          <div style={{ position: 'relative' }} key={index}>
            <QuestionCard
              index={index}
              data={element}
              setElements={setElements}
              elements={elements}
              handleRemoveQuestionBlock={handleRemoveQuestionBlock}
              handleAddElement={handleAddElement}
              embed={embed}
            />
            <br />
            <div style={{ position: 'absolute', right: '-5%', top: '-5%' }}>
              <IconButton
                onClick={(e: any) => handleRemoveQuestionBlock(index)}
                sx={{ backgroundColor: '#fff' }}
              >
                <Icon icon="bi:trash" fontSize={18} color="red" />
              </IconButton>
            </div>
          </div>
        );
      })}
      <Divider>
        <IconButton
          color="primary"
          aria-label="Add"
          onClick={createNewQuestionCard}
        >
          <Icon icon="carbon:add-filled" fontSize={24} />
        </IconButton>
      </Divider>
    </div>
  );
};
export default BotQuestionsEditor;
