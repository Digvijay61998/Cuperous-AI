import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Icon from 'src/@core/components/icon';
import { Alert } from '@mui/lab';
import {
  Button,
  Divider,
  Paper,
  Stack,
  Typography,
  TextField,
} from '@mui/material';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import ListItemButton from '@mui/material/ListItemButton';
import ListSubheader from '@mui/material/ListSubheader';
import ListItemIcon from '@mui/material/ListItemIcon';
export interface DialogTitleProps {
  id: string;
  children?: React.ReactNode;
  onClose: () => void;
}
function BootstrapDialogTitle(props: DialogTitleProps) {
  const { children, onClose, ...other } = props;

  return (
    <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
      {children}
      {onClose ? (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <Icon icon="eva:close-fill" fontSize={24} />
        </IconButton>
      ) : null}
    </DialogTitle>
  );
}

type Props = {
  handleClose: () => void;
  openModal: boolean;
  handleCloseModal: () => void;
  handleSaveCloseModal: () => void;
  saveState: any;
};
export function CustomAttributeDialog(props: Props) {
  const {
    handleClose,
    openModal,
    handleCloseModal,
    handleSaveCloseModal,
    saveState,
  } = props;
  return (
    <Dialog
      onClose={handleClose}
      aria-labelledby="customized-dialog-title"
      open={openModal}
    >
      <BootstrapDialogTitle
        id="customized-dialog-title"
        onClose={handleCloseModal}
      >
        <div style={{ textAlign: 'center' }}>Add a custom attribute</div>
      </BootstrapDialogTitle>
      <DialogContent style={{ minWidth: '350px' }}>
        <Alert severity="info">
          The attribute's name can only contain alphanumeric characters which
          are letters A-Z, numbers 0-9, dash or underscore.
        </Alert>
        <div
          className="bot-sub-title"
          style={{
            display: 'flex',
            alignContent: 'center',
            alignItems: 'center',
            marginTop: 10,
          }}
        >
          <Typography>Attribute name</Typography>
        </div>
        <div className="setting-components">
          <TextField
            onChange={saveState}
            fullWidth
            size="small"
            placeholder="Type attribute name here"
          />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseModal}>Cancel</Button>
        <Button variant="contained" autoFocus onClick={handleSaveCloseModal}>
          Add attribute
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const attributesOption = [
  { name: 'Name', icon: 'wpf:name', label: 'John Wick', alias: 'default_name' },
  {
    name: 'Email',
    icon: 'clarity:email-solid',
    label: 'john@examplte.com',
    alias: 'default_email', 
  },
  {
    name: 'Language',
    icon: 'cil:language',
    label: 'English',
    alias: 'default_language',
  },
  {
    name: 'TimeZone',
    icon: 'file-icons:moment-timezone',
    label: 'Europe/Warsaw',
    alias: 'default_timezone',
  },
  {
    name: 'Gender',
    icon: 'ph:gender-intersex-bold',
    label: 'Male',
    alias: 'default_gender',
  },
  { name: 'City', icon: 'bxs:city', label: 'Warsaw', alias: 'default_city' },
  {
    name: 'Region',
    icon: 'clarity:map-marker-solid',
    label: 'Dolny Slack',
    alias: 'default_region',
  },
  {
    name: 'Country',
    icon: 'dashicons:location-alt',
    label: 'Spain',
    alias: 'default_country',
  },
];

type attributeListProps = {
  anchorEl: any;
  open: boolean;
  handleClose: () => void;
  handleSelectAttribute: any;
  handleClickOpen: () => void;
  id: string;
  customAttributesOption?: any;
  defaultAttributesOption?: any;
};
export function CommonAttributeList(props: attributeListProps) {
  const {
    anchorEl,
    open,
    handleClose,
    handleSelectAttribute,
    handleClickOpen,
    id,
    customAttributesOption,
    defaultAttributesOption
  } = props;
  return (
    <Menu
      id={id}
      anchorEl={anchorEl}
      open={open}
      onClose={handleClose}
      MenuListProps={{
        'aria-labelledby': 'lock-button',
        role: 'listbox',
      }}
    >
      <List
        sx={{ px: 4, py: 2, height: 'auto' }}
        subheader={<ListSubheader>Attributes</ListSubheader>}
      >
        {defaultAttributesOption && defaultAttributesOption.length && defaultAttributesOption.map((option: any, index: number) => (
          <ListItem
            sx={{ cursor: 'pointer' }}
            component="div"
            disablePadding
            key={index}
            onClick={(event) => handleSelectAttribute(event, option.value)}
          >
            <ListItemIcon>
              <Icon icon={option?.icon} fontSize={17} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography sx={{ fontSize: '0.9rem', pr: 5 }}>
                    {option.label}
                  </Typography>
               
                </Stack>
              }
            />
          </ListItem>
        ))}
        {/* custom attribute of bot */}
        {customAttributesOption?.length > 0 &&
          customAttributesOption?.map((option: any, index: any) => (
            <ListItem
              sx={{ cursor: 'pointer' }}
              component="div"
              disablePadding
              key={option.name}
              onClick={(event) => handleSelectAttribute(event, option.value)}
            >
              {/* <ListItemIcon>
                <Icon
                  icon={'material-symbols:check-small-rounded'}
                  fontSize={17}
                />
              </ListItemIcon> */}
              <ListItemText
                primary={
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography sx={{ fontSize: '0.9rem', pr: 5 }}>
                      {option.label}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', pr: 2 }}>
                      {'Custom'}
                    </Typography>
                  </Stack>
                }
              />
            </ListItem>
          ))}
      </List>
      <Divider style={{ margin: 0 }} />
      <Button
        sx={{ textTransform: 'capitalize' }}
        color="primary"
        fullWidth
        size="small"
        onClick={handleClickOpen}
      >
        Add custom attribute
      </Button>
    </Menu>
  );
}
