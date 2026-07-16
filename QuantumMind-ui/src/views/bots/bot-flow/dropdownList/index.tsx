import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/router';
import React from 'react';
import { useDispatch } from 'react-redux';
import Icon from 'src/@core/components/icon';
import { AppDispatch } from 'src/store';
import { updateBotFlow } from 'src/store/apps/bot-flow';
import { nodeList } from './nodeList';
type Props = {
  open: any;
  anchorEl: any;
  setAnchorEl: any;
  setNodeType: any;
  setOpen: any;
  setNodes: any;
  setEdges: any;
  nodes: any;
  edges: any;
  selectedNode: any;
  id: any;
};
export default function DropDownList(props: Props) {
  const nodeId = nanoid();
  const router = useRouter();
  const botId = router.query.botId;
  const {
    anchorEl,
    open,
    setAnchorEl,
    setNodeType,
    setOpen,
    setEdges,
    setNodes,
    nodes,
    edges,
    selectedNode,
    id
  } = props;
  const handleClose = () => {
    setAnchorEl(null);
    setOpen(false);
  };
  const dispatch = useDispatch<AppDispatch>();

  const listFeatures = [
    {
      type: 'USER_INPUT',
      name: 'User Input',
      icon: 'bxs:user',
    },
    {
      type: 'AI_NODE',
      name: 'AI Node',
      icon: 'streamline:computer-robot-cyborg-artificial-robotics-robot-intelligence-machine-technology-android'
    },
    {
      type: 'BOT_RESPONSE',
      name: 'Bot Response',
      icon: 'bi:send-fill',
    },
    {
      type: 'TICKET',
      name: 'Create Service Request',
      icon: 'bx:git-pull-request',
    },
    {
      type: 'SET_ATTRIBUTES',
      name: 'Set Attributes',
      icon: 'bi:braces-asterisk',
    },
    {
      type: 'CLOSE_CHAT',
      name: 'Close Chat',
      icon: 'akar-icons:chat-error',
    },
    {
      type: 'FILE_ATTACHMENT',
      name: 'Attachment Input',
      icon: 'eva:attach-fill',
    },
    {
      type: 'QUESTIONS',
      name: 'Questionnaire',
      icon: 'akar-icons:question-fill',
    },
    // {
    //   type: 'FAQ',
    //   name: 'FaQ',
    //   icon: 'ph:chats-fill',
    // },
    {
      type: 'WEBHOOK',
      name: 'Webhook',
      icon: 'tabler:fish-hook',
    },
    {
      type: 'ADD_TO_SEGMENT',
      name: 'Add Segment',
      icon: 'bx:pie-chart-alt',
    },
    {
      type: 'REMOVE_FROM_SEGMENT',
      name: 'Remove From Segment',
      icon: 'ep:remove-filled',
    },
    {
      type: 'TRANSFER_TO_AGENT',
      name: 'Transfer To Agent',
      icon: 'bx:transfer',
    },
    {
      type: 'GO_TO_STEP',
      name: 'Go To Step',
      icon: 'icon-park-solid:transfer',
    },
    {
      type: 'FALL_BACK',
      name: 'Fall Back',
      icon: 'pajamas:false-positive',
    },
  ];
  const handleGetNodeType = async (
    e: React.MouseEvent<HTMLElement>,
    value: string,
  ) => {    
    setNodeType(value);
    let newNodeId = `node_${nodeId}`;
    let updatedNodes: any = [];
    let updatedEdges: any = [];
    if (
      value === 'WEBHOOK' ||
      value === 'QUESTIONS' ||
      value === 'TRANSFER_TO_AGENT'
    ) {
      const successNodeId = `success_${nodeId}`;
      const failureNodeId = `failure_${nodeId}`;
      const webhookNode = nodeList(
        value,
        selectedNode.position.x,
        selectedNode.position.y,
        newNodeId,
      );

      const successNode = nodeList(
        'SUCCESS',
        webhookNode.position.x,
        webhookNode.position.y,
        successNodeId,
      );

      const failureNode = nodeList(
        'FAILURE',
        webhookNode.position.x,
        webhookNode.position.y,
        failureNodeId,
      );
      updatedNodes = [...nodes, webhookNode, successNode, failureNode];
      setNodes(updatedNodes);
      let newEdge: any = {
        id: `el-${newNodeId}`,
        source: selectedNode.id,
        target: newNodeId,
        sourceHandle: 'a',
      };

      let successEdge: any = {
        id: `el-${successNodeId}`,
        source: newNodeId,
        target: successNodeId,
        sourceHandle: 'a',
      };

      let failureEdge: any = {
        id: `el-${failureNodeId}`,
        source: newNodeId,
        target: failureNodeId,
        sourceHandle: 'a',
      };
      updatedEdges = [...edges, newEdge, successEdge, failureEdge];
      dispatch(
        updateBotFlow({ nodes: updatedNodes, edges: updatedEdges, _id: botId }),
      );
      setEdges(updatedEdges);
      setOpen(false);
    } else {
      updatedNodes = [
        ...nodes,
        nodeList(
          value,
          selectedNode.position.x,
          selectedNode.position.y,
          newNodeId,
        ),
      ];

      setNodes(updatedNodes);

      let newEdge: any = {
        id: `el-${newNodeId}`,
        source: selectedNode.id,
        target: newNodeId,
        sourceHandle: 'a',
      };
      updatedEdges = [...edges, newEdge];
      dispatch(
        updateBotFlow({ nodes: updatedNodes, edges: updatedEdges, _id: botId }),
      );
      setEdges(updatedEdges);
      setOpen(false);
    }
  };
  return (
    <div style={{ zIndex: 100 }}>
      <Menu
        id={id}
      
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {listFeatures.map((item: any, index: number) => (
          <MenuItem
            key={index}
            onClick={(e) => handleGetNodeType(e, item.type)}
            value={item.type}
          >
            <ListItemIcon>
              <Icon fontSize={19} icon={item.icon} />
            </ListItemIcon>
            <ListItemText> {item.name}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
}
