// ** React Imports
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { CustomAttributeDialog, CommonAttributeList } from './Common';
import { TextField } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from 'src/store';
import { getNodeDetails, nodeUpdate } from 'src/store/apps/bot-flow';
import IconButton from '@mui/material/IconButton';
import Icon from '../../../@core/components/icon';

type BotAttachmentInputProps = {
  title: string | null;
  setTitle: any;
  setOpen: any;
  nodeId: string;
};

const BotAttachmentInputEditor = (props: BotAttachmentInputProps) => {
  const {nodeId: id, title, setTitle, setOpen } = props;

  const [fileType, setFileType] = useState('');
  const [alias, setAlias] = useState('');
  const nodeDetails: any = useSelector(
    (state: RootState) => state.flow.nodeDetails,
    );
    const dispatch = useDispatch<AppDispatch>();
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
  useEffect(() => {
    if (id) {
      dispatch(getNodeDetails(id));
    }
  }, [dispatch, id]);
  useEffect(() => {
    if (nodeDetails?.id) {
      setFileType(nodeDetails?.payload?.fileType);
      setAlias(nodeDetails.payload?.alias);
      setTitle("")
      if (nodeDetails?.title?.length > 0) {
        setTitle(nodeDetails?.title);
      }
    }
  }, [nodeDetails]);
  const handleSubmit = (e: any) => {
    e.preventDefault();
    dispatch(nodeUpdate({ id, title, payload: { fileType, alias }, customAttributes:[{[alias]: alias}] }));
    setOpen(false);
  };
  const handleChange = (e: any) => {
    setFileType(e.target.value);
  };
  const [anchorMenuEl, setAnchorMenuEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorMenuEl);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleCloseMenuAttibute = () => {
    setAnchorMenuEl(null);
  };
  const handleClickOpenMenuAttribute = (
    event: React.MouseEvent<HTMLElement>,
  ) => {
    setAnchorMenuEl(event.currentTarget);
  };
  const [openModal, setOpenModal] = React.useState(false);

  const handleClickOpen = () => {
    setOpenModal(true);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleSelectAttributeName = (
    event: React.MouseEvent<HTMLElement>,
    alias: string,
  ) => {
    setAlias(alias);
    setAnchorMenuEl(null);
  };
  const saveState = (e: any) => {
    setAlias(e.target.value);
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
      <div
        className="bot-sub-title"
        style={{
          display: 'flex',
          alignContent: 'center',
          alignItems: 'center',
        }}
      >
        <span>Trigger only if the user sends</span>
      </div>
      <div className="setting-components">
        <FormControl fullWidth size="small">
          {/* <InputLabel id="Attachment-select">Any attachment</InputLabel> */}
          <Select
            fullWidth
            value={fileType}
            id="select-attachment"
            // label="Select Block"
            labelId="Attachment-select"
            onChange={handleChange}
            inputProps={{ placeholder: 'Select Attachment' }}
          >
            <MenuItem value={'image'}>Image Attachment</MenuItem>
            {/* <MenuItem value={'video'}>Video Attachment</MenuItem> */}
            <MenuItem value={'document'}>Document Attachment</MenuItem>
            {/* <MenuItem value={'any'}>Any Attachment</MenuItem> */}
          </Select>
        </FormControl>
      </div>
      <div
        className="bot-sub-title"
        style={{
          display: 'flex',
          alignContent: 'center',
          alignItems: 'center',
          marginTop: '10px',
        }}
      >
        <span>Save the file URL to the attribute</span>
      </div>
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
    </div>
  );
};

export default BotAttachmentInputEditor;
