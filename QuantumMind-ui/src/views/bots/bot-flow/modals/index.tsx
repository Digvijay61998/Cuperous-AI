import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useEffect, useRef, useState } from 'react';
import AddSegment from 'src/views/bots/bot-flow/modals/AddSegment';
import AttachmentInput from 'src/views/bots/bot-flow/modals/AttachmentInput';
import BotResponse from 'src/views/bots/bot-flow/modals/BotResponse';
import CreateServiceRequest from 'src/views/bots/bot-flow/modals/CreateServiceRequest';
import FaQ from 'src/views/bots/bot-flow/modals/FaQ';
import GoToStep from 'src/views/bots/bot-flow/modals/GoToStep';
import Questions from 'src/views/bots/bot-flow/modals/Questions';
import RemoveFromSegment from 'src/views/bots/bot-flow/modals/RemoveFromSegment';
import SetAttributes from 'src/views/bots/bot-flow/modals/SetAttributes';
import TransferChat from 'src/views/bots/bot-flow/modals/TransferChat';
import UserInput from 'src/views/bots/bot-flow/modals/UserInput';
import Webhook from 'src/views/bots/bot-flow/modals/Webhook';
import AiNode from 'src/views/bots/bot-flow/modals/AiNode'
import OpenTemplate from 'src/views/bots/bot-flow/modals/OpenTemplate';
import { useRouter } from 'next/router';

type Props = {
  open: boolean;
  setOpen: any;
  nodeId: any;
  nodeType: any;
  id: any;
  setNodes: any;
  nodes: any;
  edges: any;
  setEdges: any;
  botId : any;
};

const index = (props: Props) => {
  const { nodeType, setOpen, nodes, nodeId, setNodes, botId } = props;
  const [title, setTitle] = useState('');
  const [divWidth, setDivWidth] = useState(402);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const handleClose = () => setOpen(false);
  const ref = useRef<any>(null);

  useEffect(() => {
    if (ref.current) {
      setDivWidth(ref?.current?.clientWidth || 402);
    }
    if (nodes) {
      let nodeList = [...nodes];
      let getNode = nodeList.filter((item: any) => item.id === nodeId);
      if (getNode.length === 1) {
        const updateNodeList: any = nodeList.map((item: any) => {
          if (item.id === nodeId) {
            return {
              ...item,
              data: { ...item.data, title },
            };
          } else {
            return item;
          }
        });
        setNodes([...updateNodeList]);
      }
    }
  }, [title]);
  const modalProps = {
    title,
    setTitle,
    handleClose,
    fullScreen,
    divWidth,
    ref,
  };
  console.log("[nodes]", nodes);
  return (
    <div>
      {nodeType === 'USER_INPUT' && <UserInput {...props} {...modalProps} />}
      {nodeType === 'FILE_ATTACHMENT' && (
        <AttachmentInput {...props} {...modalProps} />
      )}
      {nodeType === 'WEBHOOK' && <Webhook {...props} {...modalProps} />}
      {nodeType === 'ADD_TO_SEGMENT' && (
        <AddSegment {...props} {...modalProps} />
      )}
      {nodeType === 'REMOVE_FROM_SEGMENT' && (
        <RemoveFromSegment {...props} {...modalProps} />
      )}
      {nodeType === 'TRANSFER_TO_AGENT' && (
        <TransferChat {...props} {...modalProps} />
      )}
      {nodeType === 'GO_TO_STEP' && <GoToStep {...props} {...modalProps} />}
      {nodeType === 'TICKET' && (
        <CreateServiceRequest {...props} {...modalProps} />
      )}
      {nodeType === 'SET_ATTRIBUTES' && (
        <SetAttributes {...props} {...modalProps} />
      )}
      {nodeType === 'FAQ' && <FaQ {...props} {...modalProps} />}
      {nodeType === 'BOT_RESPONSE' && (
        <BotResponse {...props} {...modalProps} />
      )}
      {nodeType === 'QUESTIONS' && <Questions {...props} {...modalProps} />}
      {nodeType === 'AI_NODE' && <AiNode {...props} {...modalProps} />}
      {nodeType === 'OPEN_TEMPLATE' && <OpenTemplate {...props} {...modalProps} />}
    </div>
  );
};

export default index;
