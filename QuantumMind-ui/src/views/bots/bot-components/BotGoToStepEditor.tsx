// ** React Imports
import { useEffect, useState } from 'react';
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

type BotGoToStepProps = {
  nodeId: string;
  title: string | null;
  setTitle: any;
  setOpen: any;
  nodes: any;
};

const BotGoToStepEditor = (props: BotGoToStepProps) => {
  const { nodeId: id, title, setTitle, setOpen, nodes } = props;

  const [block, setBlock] = useState('');

  const dispatch = useDispatch<AppDispatch>();

  const nodeDetails: any = useSelector(
    (state: RootState) => state.flow.nodeDetails,
  );

  useEffect(() => {
    if (id) {
      dispatch(getNodeDetails(id));
    }
  }, [dispatch, id]);
  useEffect(() => {
    if (nodeDetails?.id) {
      setBlock(nodeDetails?.payload?.blockId);
      setTitle('');
      if (nodeDetails?.title?.length > 0) {
        setTitle(nodeDetails?.title);
      }
    }
  }, [nodeDetails]);

  const handleChange = (event: SelectChangeEvent) => {
    setBlock(event.target.value as string);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    dispatch(
      nodeUpdate({
        id,
        title,
        payload: {
          blockId: block,
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
        <span>Block</span>
      </div>
      <div className="setting-components">
        <FormControl fullWidth size="small">
          {/* <InputLabel id="GoToStep-select">Select Block</InputLabel> */}
          <Select
            fullWidth
            value={block}
            id="select-GoToStep"
            // label="Select Block"
            labelId="GoToStep-select"
            onChange={handleChange}
            inputProps={{ placeholder: 'Select Block' }}
          >
            {nodes?.length > 0 &&
              nodes.map((node: any, index: any) => (
                <MenuItem key={index} value={node.id}>
                  {node.data.title || node.nodeType}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </div>
    </div>
  );
};

export default BotGoToStepEditor;
