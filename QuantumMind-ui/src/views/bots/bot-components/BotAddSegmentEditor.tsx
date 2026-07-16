// ** React Imports
import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from 'src/store';
import { getNodeDetails, nodeUpdate } from 'src/store/apps/bot-flow';
import IconButton from '@mui/material/IconButton';
import Icon from '../../../@core/components/icon';

type BotAddSegmentProps = {
  nodeId: string;
  title: string | null;
  setTitle: any;
  setOpen: any;
}

const BotAddSegmentEditor = (props:BotAddSegmentProps) => {
  const {nodeId: id, title, setTitle, setOpen } = props;

  const [segment, setSegment] = useState('');
  const [segmentList, setSegmentList] = useState<any>([]);

  const handleChange = (event: SelectChangeEvent) => {
    setSegment(event.target.value as string);
  };
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
    if (embed?.segments) {
      setSegmentList(embed?.segments);
    }
    if (nodeDetails?.id) {
      setSegment(nodeDetails?.payload?.segmentId);
      setTitle('');
      if (nodeDetails?.title?.length>0) {
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
          segmentId: segment,
        },
      }),
    );
    setOpen(false);
  };

  return (
    <div style={{ minWidth:'350px'}}>
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
        className='bot-sub-title' 
        style={{
          display: 'flex',
          alignContent: 'center',
          alignItems: 'center'
        }}
      >
        <span>Segment</span>
      </div>
      <div className='setting-components'>
        <FormControl fullWidth size='small'>
            {/* <InputLabel id="AddSegment-select">Select Segment</InputLabel> */}
            <Select
            fullWidth
            value={segment}
            id="select-AddSegment"
            // label="Select Segment"
            labelId="AddSegment-select"
            onChange={handleChange}
            inputProps={{ placeholder: 'Select Segment' }}
            >
              {segmentList.map((item: any, index: number) => (
                <MenuItem value={item.id}>{item.name}</MenuItem>
              ))}
            </Select>
        </FormControl>
      </div>
      
    </div>
  )
}

export default BotAddSegmentEditor
