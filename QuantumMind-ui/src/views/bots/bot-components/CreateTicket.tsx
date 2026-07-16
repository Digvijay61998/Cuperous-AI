import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from 'src/store';
import { getNodeDetails, nodeUpdate } from 'src/store/apps/bot-flow';
import Icon from '../../../@core/components/icon';

import {
  Box,
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Stack
} from '@mui/material';
type Props = {
  nodeId: string;
  title: string | null;
  setTitle: any;
  setOpen: any;
};
type ticketType = {
  subject: string;
  type: string;
};
const CreateTicket = (props: Props) => {
  const { nodeId: id, title, setTitle, setOpen } = props;

  const nodeDetails: any = useSelector(
    (state: RootState) => state.flow.nodeDetails,
  );
  const embed: any = useSelector((state: RootState) => state.flow.embed);
  const [tagsList, setTagsList] = useState<any>([]);
  const [priorityList, setPriorityList] = useState<any>([]);
  const dispatch = useDispatch<AppDispatch>();
  const subRef = useRef<any>(null);
  const [ticketDetails, setTicketDetails] = useState<any>({
    ticketSubject: '',
    type: 'ticket',
    tags: [],
    priority: '',
  });

  useEffect(() => {
    if (embed?.tags) {
      setTagsList(embed?.tags);
    }
    if (embed?.priorities) {
      setPriorityList(embed?.priorities);
    }
  }, [embed]);

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
      setTicketDetails({
        ...nodeDetails?.payload
      });
    }
  }, [nodeDetails]);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    dispatch(
      nodeUpdate({
        id,
        title,
        payload: {
          ...ticketDetails
        },
      }),
    );
    setOpen(false);
  };
  const saveState = (e: any) => {
    setTicketDetails({ ...ticketDetails, [e.target.name]: e.target.value });
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
        <span>subject</span>
      </div>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TextField
          onChange={saveState}
          placeholder="Ticket Subject"
          name="ticketSubject"
          value={ticketDetails?.ticketSubject}
          fullWidth
          size="small"
        />
      </Box>
      <br />
      {/* add priority drop down list */}

      <div className="setting-components">
        <FormControl fullWidth size="small">
          <InputLabel id="priority-select">Priority</InputLabel>
          <Select
            fullWidth
            id="select-priority"
            label="Priority"
            name="priority"
            labelId="priority-select"
            value={ticketDetails?.priority}
            onChange={saveState}
            inputProps={{ placeholder: 'priority' }}
          >
            {priorityList?.map((item: any, index: number) => (
              <MenuItem key={index} value={item}>
                {item}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
      <br />
      <div>
        <FormControl fullWidth>
          <InputLabel
            id="demo-simple-select-label"
            style={{ marginTop: '-6px' }}
          >
           Select Tags
          </InputLabel>
          <Select
            size="small"
            fullWidth
            multiple
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            name="tags"
            label="Select Tags"
            value={ticketDetails?.tags ?? []}
            onChange={saveState}
            
          >
               {tagsList && tagsList?.default &&
              tagsList?.default.length > 0 &&
              tagsList?.default.map((item: any, index: number) => (
                <MenuItem key={index} value={item?.name}>
                  <Stack direction='row' justifyContent='space-between' alignItems='center' width="100%">
                    <Typography>
                    {item?.name}
                    </Typography>
                    <Typography>
                    {item?.type.toLowerCase()}
                    </Typography>
                  </Stack>
                </MenuItem>
              ))}
            {tagsList && tagsList?.custom &&

              tagsList?.custom.length > 0 &&
              tagsList?.custom.map((item: any, index: number) => (
                <MenuItem key={index} value={item?.name}>
                  <Stack direction='row' justifyContent='space-between' alignItems='center' width="100%">
                    <Typography>
                    {item?.name}
                    </Typography>
                    <Typography>
                    {item?.type.toLowerCase()}
                    </Typography>
                  </Stack>
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </div>
      {/* <div 
        className='bot-sub-title' 
        style={{
          display: 'flex',
          alignContent: 'center',
          alignItems: 'center'
        }}
      >
        <span>visitor's email address</span>
      </div>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TextField placeholder="type email address" fullWidth size='small'/>
      </Box>
      <br/>
      <div 
        className='bot-sub-title' 
        style={{
          display: 'flex',
          alignContent: 'center',
          alignItems: 'center'
        }}
      >
        <span>Create a Ticket</span>
      </div>
      <div className='setting-components'>
        <FormControl fullWidth size='small'>
            <InputLabel id="CreateTicket-select">Create Ticket</InputLabel>
            <Select
            fullWidth
            id="select-CreateTicket"
            label="Create Ticket"
            labelId="CreateTicket-select"
            inputProps={{ placeholder: 'CreateTicket' }}
            >
              <MenuItem value={10}>Within the group</MenuItem>
              <MenuItem value={20}>to another group</MenuItem>
            </Select>
        </FormControl>
      </div> */}
    </div>
  );
};

export default CreateTicket;
