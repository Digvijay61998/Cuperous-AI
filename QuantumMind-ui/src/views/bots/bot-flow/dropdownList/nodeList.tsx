import classes from './node.module.css';
export const nodeList: any =  (
  nodeType: string,
  x: number,
  y: number,
  id: string,
) => {
  const append = {
    position: { x:  x + 300, y:  nodeType === "SUCCESS" ? y - 50 : y + 50 },
    id,
    type:
      nodeType === 'CLOSE_CHAT' 
        ? 'end_node'
        : 'custom_node',
    nodeType,
  };
  const listNodes: any = {
    USER_INPUT: {
      data: { label: 'User Input', icon: 'bxs:user' },
    },
    AI_NODE : {
      data : {label : "AI Node", icon: 'streamline:computer-robot-cyborg-artificial-robotics-robot-intelligence-machine-technology-android'}
    },
    BOT_RESPONSE: {
      data: { label: 'Bot Response', icon: 'bi:send-fill' },
    },
    TICKET: {
      data: { label: 'Create Service Request', icon: 'bx:git-pull-request' },
    },
    SET_ATTRIBUTES: {
      data: { label: 'Set Attributes', icon: 'bi:braces-asterisk' },
    },
    CLOSE_CHAT: {
      data: { label: 'Close Chat', icon: 'akar-icons:chat-error' },
    },
    FILE_ATTACHMENT: {
      data: { label: 'Attachment Input', icon: 'eva:attach-fill' },
    },
    QUESTIONS: {
      data: { label: 'Questionnaire', icon: 'akar-icons:question-fill' },
    },
    FAQ: {
      data: { label: 'FaQ', icon: 'ph:chats-fill' },
    },
    WEBHOOK: {
      data: { label: 'Webhook', icon: 'tabler:fish-hook' },
    },
    ADD_TO_SEGMENT: {
      data: { label: 'Add To Segment', icon: 'bx:pie-chart-alt' },
    },
    REMOVE_FROM_SEGMENT: {
      data: { label: 'Delete from Segment', icon: 'ep:remove-filled' },
    },
    TRANSFER_TO_AGENT: {
      data: { label: 'Transfer To Agent', icon: 'bx:transfer' },
    },
    GO_TO_STEP: {
      data: { label: 'Go To Step', icon: 'icon-park-solid:transfer' },
    },
    FALL_BACK: {
      data: { label: 'Fall Back', icon: 'pajamas:false-positive' },
    },
    SUCCESS: {
      data: { label: 'Success', icon: 'akar-icons:circle-check-fill' },
    },
    FAILURE: {
      data: { label: 'Failure', icon: 'entypo:circle-with-cross' },
    },
  };
  const newNode = listNodes[nodeType];
  return { ...newNode, ...append };
};
