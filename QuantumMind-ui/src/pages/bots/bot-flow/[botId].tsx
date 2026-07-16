import { LoadingButton } from '@mui/lab';
import { Button } from '@mui/material';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ReactFlow, {
  addEdge,
  Background,
  BackgroundVariant,
  Connection,
  ConnectionLineType,
  Edge,
  FitViewOptions,
  Node,
  useEdgesState,
  useNodesState
} from 'reactflow';
import Icon from 'src/@core/components/icon';
import { AppDispatch, RootState } from 'src/store';
import { getBotFLow, updateBotFlow } from 'src/store/apps/bot-flow';
import DeleteNode from 'src/views/bots/bot-flow/DeleteNodeFromFlow';
import DropDownList from 'src/views/bots/bot-flow/dropdownList';
import NodeModal from 'src/views/bots/bot-flow/modals';
import {
  CustomNode,
  EndNode,
  StartNode
} from 'src/views/bots/bot-flow/nodes/CustomNode';
import RightClickOption from 'src/views/bots/bot-flow/RightClickMenuOptions';
import BotWidget from 'src/views/bots/widget';
const nodeTypes = {
  start_node: StartNode,
  custom_node: CustomNode,
  end_node: EndNode,
};

const fitViewOptions: FitViewOptions = {
  padding: 0.1,
};
const defaultEdgeOptions = {
  animated: true,
  color: '#fff',
};
function Flow() {
  const router = useRouter();
  const botId = router.query.botId;
  const botDetails: any = useSelector(
    (state: RootState) => state.flow.botDetails,
  );
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [anchorEl, setAnchorEl] = useState<null | any>(null);
  const [nodeType, setNodeType] = useState<any>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [isChatBotOpen, setIsChatBotOpen] = useState(false);
  const [openFaQModal, setOpenFaQModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>({});
  const [isBotUpdated, setIsBotUpdated] = useState(false);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );
  useEffect(() => {
    if (botId) {
      dispatch(getBotFLow(botId));
    }
  }, [botId]);
  useEffect(() => {
    if (botDetails) {
      setNodes(botDetails.nodes);
      setEdges(botDetails.edges);
    }
  }, [botDetails]);
  const [deleteAnchorRef, setDeleteAnchorRef] = useState<null | any>(null);
  const [deleteNodeDialog, setDeleteNodeDialog] = useState(false);
  const handleCreateNode = (event: React.MouseEvent<any>, node: any) => {
    const isNodeHasChildren = edges?.filter(
      (edge: any) => edge.source === node.id,
    );
    if (node?.type !== 'start_node') {
      setDeleteAnchorRef(event.currentTarget);
      setSelectedNode(node);
    }
    if (!(node?.type === 'end_node' || isNodeHasChildren?.length > 0)) {
      setAnchorEl(event.currentTarget);
      setOpen((prev: boolean) => !prev);
    } else if (node?.nodeType === 'BOT_RESPONSE') {
      setAnchorEl(event.currentTarget);
      setOpen((prev: boolean) => !prev);
    }
  };

  const handleOpenModal = (node: Node) => {
    setOpenFaQModal(true);
    setSelectedNode(node);
  };

  const handleUpdateBotFlow = async () => {
    setLoading(true);
    await dispatch(updateBotFlow({ nodes, edges, _id: botId }));
    setLoading(false);
  };

  //
  const [anchorRightClickEl, setAnchorRightClickEl] = React.useState<any>(null);
  const openMenu = Boolean(anchorRightClickEl);

  const handleCloseMenu = () => {
    setAnchorRightClickEl(null);
  };

  // open right click menu on mouse right click
  const handleRightClick = (event: React.MouseEvent, node: any) => {
    event.preventDefault();
    handleCloseMenu();
    if (node?.type !== 'start_node') {
      setAnchorRightClickEl(event.currentTarget);
      setSelectedNode(node);
    }
  };
  const handleOpenDeleteNodeDialog = (event: React.MouseEvent<any>) => {
    setDeleteNodeDialog((prev: boolean) => !prev);
    setDeleteAnchorRef(event.currentTarget);
    handleCloseMenu();
  };

  const [anchorElMenu, setAnchorElMenu] = React.useState<any>(null);
  const [openMenuList, setOpenMenuList] = React.useState<boolean>(false);
  const handlOpenAddNodePopUp = (event: React.MouseEvent<any>) => {
    setSelectedNode(selectedNode);
    setAnchorElMenu(event.currentTarget);
    setOpenMenuList((prev: boolean) => !prev);
    handleCloseMenu();
  };

  return (
    <ReactFlow
      nodes={nodes}
      onNodesChange={onNodesChange}
      edges={edges}
      onEdgesChange={onEdgesChange}
      onNodeMouseEnter={(e: React.MouseEvent, node: any) =>
        handleCreateNode(e, node)
      }
      onNodeContextMenu={(e: React.MouseEvent, node: any) =>
        handleRightClick(e, node)
      }
      style={{ position: 'relative' }}
      onConnect={onConnect}
      onNodeClick={(e: React.MouseEvent, node: Node) => handleOpenModal(node)}
      nodeTypes={nodeTypes}
      connectionLineType={ConnectionLineType.SmoothStep}
      fitViewOptions={fitViewOptions}
    >
      <Background
        variant={BackgroundVariant.Cross}
        color="#c0c0c0"
        style={{ backgroundColor: 'rgb(0, 30, 60)' }}
        gap={25}
        size={1}
      />
      {openMenuList && anchorElMenu && (
        <DropDownList
          nodes={nodes}
          edges={edges}
          setNodes={setNodes}
          setEdges={setEdges}
          selectedNode={selectedNode}
          setNodeType={setNodeType}
          setAnchorEl={setAnchorElMenu}
          anchorEl={anchorElMenu}
          open={openMenuList}
          setOpen={setOpenMenuList}
          id={selectedNode.id}
        />
      )}

      {deleteNodeDialog && deleteAnchorRef && (
        <DeleteNode
          nodes={nodes}
          edges={edges}
          setNodes={setNodes}
          setEdges={setEdges}
          selectedNode={selectedNode}
          open={deleteNodeDialog}
          setOpen={setDeleteNodeDialog}
        />
      )}
      {openFaQModal && (
        <NodeModal
          open={openFaQModal}
          setOpen={setOpenFaQModal}
          setNodes={setNodes}
          nodes={nodes}
          nodeId={selectedNode?.id}
          nodeType={selectedNode.nodeType}
          id={selectedNode.id}
          edges={edges}
          setEdges={setEdges}
          botId={botId}
        />
      )}
      <div
        style={{
          padding: '0.5rem',
          margin: '0.5rem',
          position: 'absolute',
          right: 0,
          top: 0,
          zIndex: 10,
          backgroundColor: '#fff',
          borderRadius: '0.2rem',
        }}
      >
        <Button
          onClick={(e: any) => setIsChatBotOpen((prev) => !prev)}
          startIcon={<Icon icon="bi:lightning-charge-fill" />}
          variant="outlined"
          size="small"
          sx={{ fontSize: '0.8rem', textTransform: 'capitalize', p: 0, mr: 3 }}
        >
          Test Your Bot
        </Button>
        <LoadingButton
          startIcon={<Icon icon="material-symbols:published-with-changes" />}
          loading={loading}
          onClick={(e) => handleUpdateBotFlow()}
          variant="contained"
          size="small"
          sx={{ fontSize: '0.8rem', textTransform: 'capitalize', p: 0, m: 0 }}
        >
          Publish
        </LoadingButton>
      </div>
      <div
        style={{
          zIndex: 10,
          position: 'absolute',
          right: 10,
          bottom: 0,
          borderRadius: '10%',
          height: '100%',
        }}
      >
        <BotWidget isChatBotOpen={isChatBotOpen} />
      </div>
       <RightClickOption
        id={selectedNode?.id}
        anchorEl={anchorRightClickEl}
        open={openMenu}
        handleClose={handleCloseMenu}
        handleOpenDeleteNodeDialog={handleOpenDeleteNodeDialog}
        handlOpenAddNodePopUp={handlOpenAddNodePopUp}
        selectedNode={selectedNode}
      />
    </ReactFlow>
  );
}

export default Flow;
