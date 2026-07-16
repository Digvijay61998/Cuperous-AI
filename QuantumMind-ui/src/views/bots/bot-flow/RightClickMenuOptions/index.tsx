import * as React from 'react';
import { styled, alpha } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Menu, { MenuProps } from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Icon from 'src/@core/components/icon';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

type Props = {
  id: string;
  anchorEl: any;
  open: boolean;
  handleClose: any;
  handleOpenDeleteNodeDialog: any;
  handlOpenAddNodePopUp: any;
  selectedNode: any;
};
const listOptions = [
  
  {
    label: 'Add Node',
    icon: 'material-symbols:add-circle',
    value: 'addNode',
    color: '#3f51b5',
  },
  {
    label: 'Delete Node',
    icon: 'bi:trash',
    value: 'deleteNode',
    color: '#f44336',
  },
];
const closeChatOptions = [
  {
    label: 'Delete Node',
    icon: 'bi:trash',
    value: 'deleteNode',
    color: '#f44336',
  },
];
export default function RightClickOption({
  id,
  anchorEl,
  open,
  handleClose,
  handleOpenDeleteNodeDialog,
  handlOpenAddNodePopUp,
  selectedNode,
}: Props) {
  return (
    <div>
      {
        (selectedNode?.nodeType === 'CLOSE_CHAT' || selectedNode?.nodeType === 'GO_TO_STEP' ) ?
        <Menu
        id={id}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {closeChatOptions.map((item: any, index: number) => (
          <>
            <MenuItem
              key={index}
              onClick={(e: any) => {
                if (item.value === 'addNode') {
                  handlOpenAddNodePopUp(e);
                } else if (item.value === 'deleteNode') {
                  handleOpenDeleteNodeDialog(e);
                }
              }}
              value={item.type}
            >
              <ListItemIcon>
                <Icon fontSize={19} icon={item.icon} color={item.color} />
              </ListItemIcon>
              <ListItemText> {item.label}</ListItemText>
            </MenuItem> 
          </>
        ))}
      </Menu>
        :
        <Menu
        id={id}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {listOptions.map((item: any, index: number) => (
          <>
            <MenuItem
              key={index}
              onClick={(e: any) => {
                if (item.value === 'addNode') {
                  handlOpenAddNodePopUp(e);
                } else if (item.value === 'deleteNode') {
                  handleOpenDeleteNodeDialog(e);
                }
              }}
              value={item.type}
            >
              <ListItemIcon>
                <Icon fontSize={19} icon={item.icon} color={item.color} />
              </ListItemIcon>
              <ListItemText> {item.label}</ListItemText>
            </MenuItem>
          </>
        ))}
      </Menu>}
    </div>
  );
}
