// ** React Imports
import { Divider, Paper, Stack, Typography } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import React, { useEffect, useState } from 'react';

// ** Icon Imports
import Icon from 'src/@core/components/icon';

import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
import { getNodeDetails, nodeUpdate } from 'src/store/apps/bot-flow';
import { CommonAttributeList, CustomAttributeDialog } from './Common';

export interface DialogTitleProps {
  id: string;
  children?: React.ReactNode;
  onClose: () => void;
}

type AttributeCardProps = {
  index: number;
  data: any;
  handleRemoveAttribute: (index: number) => void;
  setAttributeListData: any;
  attributeListData: any;
  handleAddAttributes: any;
};
function AttributeCard(props: AttributeCardProps) {
  const {
    setAttributeListData,
    attributeListData,
    handleAddAttributes,
    data,
    index,
  } = props;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClose = () => {
    setAnchorEl(null);
  };
  const [attributesList, setAttributesList] = useState<any>([]);
  const [customAttributesList, setCustomAttributesList] = useState<any>([]);
  
  const embed: any = useSelector((state: RootState) => state.flow.embed);
useEffect(()=>{
  if (embed?.attributes) {
    setAttributesList(embed?.attributes);
  }
  if (embed?.customAttributes) {
    setCustomAttributesList(embed?.customAttributes);
  }
},[embed])
  const [openModal, setOpenModal] = React.useState(false);
  const saveState = (e: any) => {
    let set = e.target.value;
    let listData: any = [...attributeListData];
    listData[index] = { ...data, set };
    setAttributeListData([...listData]);
  };
  const handleClickOpen = () => {
    setOpenModal(true);
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
    set: string,
  ) => {
    let listData: any = attributeListData;
    listData[index] = { ...data, set };
    setAttributeListData([...listData]);
    setAnchorMenuEl(null);
  };

  return (
    <>
      <Paper className="setting-components" sx={{ p: 5, position: 'relative' }}>
        <IconButton
          sx={{ position: 'absolute', right: -10, top: -9 }}
          color="error"
          aria-label="Remove"
          onClick={(event) => {
            props.handleRemoveAttribute(index);
          }}
        >
          <Icon icon="bi:trash" fontSize={20} />
        </IconButton>

        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          style={{ padding: '10px 0' }}
        >
          <Typography component="div" style={{ width: '40px' }}>
            SET
          </Typography>
          <TextField
            fullWidth
            id="setAtt"
            size="small"
            placeholder="Choose attribute type"
            onClick={handleClickOpenMenuAttribute}
           
            value={
              attributesList?.find((e: any) => e.value === data?.set)?.label ||
              customAttributesList?.find((e: any) => e.value === data?.set)?.label ||
              data?.set ||
              ''
            }
          />
        </Stack>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          style={{ padding: '10px 0' }}
        >
          <Typography component="div" style={{ width: '40px' }}>
            TO
          </Typography>
          <TextField
            fullWidth
            id="setAttValue"
            size="small"
            placeholder="Type attribute value"
            name="to"
            value={data.to}
            onChange={(e: any) => handleAddAttributes(e, data, index)}
          />
        </Stack>
      </Paper>

      <CommonAttributeList
        handleSelectAttribute={handleSelectAttributeName}
        anchorEl={anchorMenuEl}
        open={openMenu}
        handleClose={handleCloseMenuAttibute}
        handleClickOpen={handleClickOpen}
        id="setAttMenu"
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
    </>
  );
}

type BotSetAttributeProps = {
  nodeId: string;
  title: string | null;
  setTitle: any;
  setOpen: any;
};

const BotSetAttributeEditor = (props: BotSetAttributeProps) => {
  const { nodeId: id, title, setTitle, setOpen } = props;
  const [attributeListData, setAttributeListData] = useState<any>([
    { set: '', to: '' },
  ]);

  const nodeDetails: any = useSelector(
    (state: RootState) => state.flow.nodeDetails,
  );
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    if (id) {
      dispatch(getNodeDetails(id));
    }
  }, [dispatch, id]);
  useEffect(() => {
    if (nodeDetails?.id) {
      setAttributeListData(nodeDetails.payload?.attributes || []);
    }
    setTitle('');
      if (nodeDetails?.title?.length > 0) {
        setTitle(nodeDetails?.title);
      }
  }, [nodeDetails]);

  function handleRemoveAttribute(index: number) {
    // setAttributeListData(prevState => prevState.filter(item => item.set!== props.set));
    let data = [...attributeListData];
    data.splice(index, 1);
    setAttributeListData(data);
  }
  const createNewAttributeCard: any = () => {
    let values = [...attributeListData];
    values.push({ set: '', to: '' });
    setAttributeListData(values);
  };
  const handleSubmit = (e: any) => {
    e.preventDefault();
    dispatch(
      nodeUpdate({
        id,
        title,
        payload: {
          attributes: attributeListData,
        },
      }),
    );
    setOpen(false);
  };
  const handleAddAttributes = (e: any, attribute: any, index: number) => {
    let arr = [...attributeListData];
    arr[index] = { ...attribute, [e.target.name]: e.target.value };
    setAttributeListData(arr);
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
      {attributeListData.map((attr: any, index: number) => {
        return (
          <div key={index}>
            <AttributeCard
              index={index}
              data={attr}
              handleRemoveAttribute={handleRemoveAttribute}
              setAttributeListData={setAttributeListData}
              attributeListData={attributeListData}
              handleAddAttributes={handleAddAttributes}
            />
            <br />
          </div>
        );
      })}
      <Divider>
        <IconButton
          color="primary"
          aria-label="Add"
          onClick={createNewAttributeCard}
        >
          <Icon icon="carbon:add-filled" fontSize={24} />
        </IconButton>
      </Divider>
    </div>
  );
};

export default BotSetAttributeEditor;
