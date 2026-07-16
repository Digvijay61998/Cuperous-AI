import React, { useState, useEffect } from 'react';
import IconButton from '@mui/material/IconButton';
import Icon from '../../../@core/components/icon';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from 'src/store';
import { getNodeDetails, nodeUpdate } from 'src/store/apps/bot-flow';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
type Props = {
  nodeId: string;
  title: string | null;
  setTitle: any;
  setOpen: any;
};
const TransferChat = (props: Props) => {
  const { nodeId: id, title, setTitle, setOpen } = props;
  const nodeDetails: any = useSelector(
    (state: RootState) => state.flow.nodeDetails,
  );
  const [groupType, setGroupType] = useState<string>('');
  const embed: any = useSelector((state: RootState) => state.flow.embed);
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    if (id) {
      dispatch(getNodeDetails(id));
    }
  }, [dispatch, id]);
  useEffect(() => {
    if (nodeDetails?.id) {
      setGroupType(nodeDetails?.payload?.group);
      setTitle('');
      if (nodeDetails?.title?.length > 0) {
        setTitle(nodeDetails?.title);
      }
    }
  }, [embed, nodeDetails]);
  const handleSubmit = (e: any) => {
    e.preventDefault();
    dispatch(
      nodeUpdate({
        id,
        title,
        payload: {
          group: groupType,
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


      <div className="setting-components">
        <FormControl fullWidth size="small">
          <InputLabel id="CreateTicket-select">Transfer Chat</InputLabel>
          <Select
            fullWidth
            id="select-CreateTicket"
            label="Transfer Chat"
            labelId="CreateTicket-select"
            inputProps={{ placeholder: 'CreateTicket' }}
            value={groupType}
            onChange={(e: any) => setGroupType(e.target.value)}
          >
            <MenuItem value="within">Within the group</MenuItem>
            <MenuItem value="another">to another group</MenuItem>
          </Select>
        </FormControl>
      </div>
    </div>
  );
};

export default TransferChat;
