import { Stack } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { useRouter } from 'next/router';
import * as React from 'react';
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { Edge, Node } from 'reactflow';
import Icon from 'src/@core/components/icon';
import { AppDispatch } from 'src/store';
import { updateBotFlow } from 'src/store/apps/bot-flow';

type Props = {
  selectedNode: any;
  setEdges: any;
  setNodes: any;
  nodes: any;
  edges: any;
  open: boolean;
  setOpen: any;
};
export default function DeleteNode(props: Props) {
  const {
    selectedNode,
    setEdges,
    setNodes,
    nodes,
    edges,
    open,
    setOpen,
  } = props;
  const { botId } = useRouter().query;
  const dispatch = useDispatch<AppDispatch>();
  const handleClose = () => {
    setOpen(false);
  };
  const [deleteType, setDeleteType] = React.useState<any>(1);
  const handleChange = (event: SelectChangeEvent) => {
    setDeleteType(event.target.value);
  };
  const [loading, setLoading] = React.useState(false);
  const handleDeleteCurrentNode = async () => {
    setLoading(true);
    // check if edges has source then don't delete the node
      const isSource = await Promise.all<any>(
        edges.filter((item: any) => {
          if (item.source === selectedNode.id) {
            return item;
          }
        }),
      );
      if (isSource.length > 0) {
        toast.error('Please delete the leaf node first');
        setLoading(false);
        return;
      }
    const filterOnlySource = await Promise.all<[Edge]>(
      edges.filter((item: any) => {
        if (item.source !== selectedNode.id) {
          return item;
        }
      }),
    );

    const filterOnlyTarget = await Promise.all<any>(
      filterOnlySource.filter((item: any) => {
        if (item.target !== selectedNode.id) {
          return item;
        }
      }),
    );

    const nodeList = await Promise.all<[Node]>(
      nodes.filter((item: any) => {
        if (item.id !== selectedNode.id) {
          return item;
        }
      }),
    );

    setEdges(filterOnlyTarget);
    setNodes(nodeList);
    await dispatch(
      updateBotFlow({ nodes: nodeList, edges: filterOnlyTarget, _id: botId }),
    );
    setLoading(false);

    setOpen(false);
  };
  const handleDeleteCurrentNodeAndItsChildren = async () => {
    setLoading(true);
    const filterOnlySource = await Promise.all<[Edge]>(
      edges.filter((item: any) => {
        if (item.source !== selectedNode.id) {
          return item;
        }
      }),
    );


    await dispatch(updateBotFlow({ nodes, edges, _id: botId }));
    setLoading(false);

    setOpen(false);
  };
  const handleType = () => {
    switch (deleteType) {
      case 1:
        handleDeleteCurrentNode();
        break;
      case 2:
        handleDeleteCurrentNodeAndItsChildren();
        break;
      default:
        toast.error('Select correct option to delete node');
    }
  };
  return (
    <Box sx={{ width: 'fit-content' }}>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogContent>
          <DialogContentText
            id="alert-dialog-description"
            sx={{ texAlign: 'center' }}
          >
            Once you delete node, you can not revert this back.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <div style={{ minWidth: '100%' }}>
            <FormControl sx={{ m: 1, minWidth: '100%' }} size="small">
              <InputLabel id="demo-select-small">
                Select delete/move type
              </InputLabel>
              <Select
                labelId="demo-select-small"
                id="demo-select-small"
                value={deleteType}
                label="Select delete/move type"
                onChange={handleChange}
              >
                <MenuItem value={0}>
                  <em>None</em>
                </MenuItem>
                {/* {selectedNode.nodeType !== 'BOT_RESPONSE' && ( */}
                <MenuItem value={1}>Only Current Node</MenuItem>
                {/* )} */}
                {/* <MenuItem value={2}>Current node And its children</MenuItem>
                <MenuItem value={3}>Move Node</MenuItem> */}
              </Select>
            </FormControl>

            <Stack
              direction="row"
              marginTop="1rem"
              justifyContent="center"
              alignItems="center"
            >
              {!loading && (
                <Button variant="outlined" size="small" onClick={handleClose}>
                  Cancel
                </Button>
              )}
              {loading ? (
                <CircularProgress />
              ) : (
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  sx={{ ml: 2 }}
                  onClick={(e: any) => handleType()}
                  startIcon={
                    <Icon
                      icon="material-symbols:delete-outline"
                      fontSize={25}
                      color="#fff"
                    />
                  }
                >
                  Delete Node
                </Button>
              )}
            </Stack>
          </div>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
