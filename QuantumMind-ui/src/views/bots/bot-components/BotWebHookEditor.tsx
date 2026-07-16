// ** React Imports
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { TextField } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from 'src/store';
import { getNodeDetails, nodeUpdate } from 'src/store/apps/bot-flow';
import IconButton from '@mui/material/IconButton';
import Icon from '../../../@core/components/icon';
import { setWeek } from 'date-fns';

type BotWebHookProps = {
  nodeId: string;
  title: string | null;
  setTitle: any;
  setOpen: any;
};

const BotWebHookEditor = (props: BotWebHookProps) => {
  const { nodeId: id, title, setTitle, setOpen } = props;

  const [eventField, setEventField] = useState('');
  const [webhook, setWebhook] = useState('');
  const [webHooksList, setWebHooksList] = useState<any>([]);

  const handleChange = (event: SelectChangeEvent) => {
    setWebhook(event.target.value as string);
  };
  const handleFieldChange = (event: any) => {
    setEventField(event.target.value as string);
  };

  const nodeDetails: any = useSelector(
    (state: RootState) => state.flow.nodeDetails,
  );
  const embed: any = useSelector((state: RootState) => state.flow.embed);
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    if (id) {
      dispatch(getNodeDetails(id));
    }
  }, [dispatch, id]);
  useEffect(() => {
    if (embed?.webhooks) {
      setWebHooksList(embed.webhooks);
    }
    if (nodeDetails?.id) {
      setEventField(nodeDetails?.payload?.eventField);
      setWebhook(nodeDetails?.payload?.webhookId);
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
          eventField: eventField,
          webhookId: webhook,
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

      <div
        className="bot-sub-title"
        style={{
          display: 'flex',
          alignContent: 'center',
          alignItems: 'center',
        }}
      >
        <span>Event</span>
      </div>
      <div className="setting-components">
        <TextField
          onChange={handleFieldChange}
          placeholder="Enter the event"
          name="event"
          value={eventField}
          fullWidth
          size="small"
        />
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
        <span>Web Hook</span>
      </div>
      <div className="setting-components">
        <FormControl fullWidth size="small">
          {/* <InputLabel id="WebHook-select">Select WebHook</InputLabel> */}
          <Select
            fullWidth
            value={webhook}
            id="select-webhook"
            // label="Select WebHook"
            labelId="WebHook-select"
            onChange={handleChange}
            inputProps={{ placeholder: 'Select WebHook' }}
          >
            {webHooksList.map((item: any, index: number) => (
              <MenuItem value={item.id}>{item.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
    </div>
  );
};

export default BotWebHookEditor;
