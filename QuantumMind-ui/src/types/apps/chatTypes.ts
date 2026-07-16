// ** Types
import { Dispatch } from 'redux';
import { ThemeColor } from 'src/@core/layouts/types';

export type StatusType = 'busy' | 'away' | 'online' | 'offline';

export type StatusObjType = {
  busy: ThemeColor;
  away: ThemeColor;
  online: ThemeColor;
  offline: ThemeColor;
};

export type ProfileUserType = {
  id: number;
  role: string;
  about: string;
  avatar: string;
  fullName: string;
  status: StatusType;
  settings: {
    isNotificationsOn: boolean;
    isTwoStepAuthVerificationEnabled: boolean;
  };
};

export type MsgFeedbackType = {
  isSent: boolean;
  isSeen: boolean;
  isDelivered: boolean;
  
};

export type ChatType = {
  message: string;
  senderId: number;
  time: Date | string;
  feedback: MsgFeedbackType;
};

export type ChatsObj = {
  id: number;
  userId: number;
  chat: ChatType[];
  unseenMsgs: number;
  lastMessage?: ChatType;
};

export type ContactType = {
  id: number;
  role: string;
  about: string;
  avatar?: string;
  fullName: string;
  status: StatusType;
  avatarColor?: ThemeColor;
};

export type ChatsArrType = {
  id: number;
  role: string;
  about: string;
  chat: ChatsObj;
  avatar?: string;
  fullName: string;
  status: StatusType;
  avatarColor?: ThemeColor;
};

export type SelectedChatType = null | {
  chat: ChatsObj;
  contact: ChatsArrType;
};

export type ChatStoreType = {
  chats: ChatsArrType[] | null;
  contacts: ContactType[] | null;
  userProfile: ProfileUserType | null;
  selectedChat: SelectedChatType;
};

export type SendMsgParamsType = {
  chat?: ChatsObj;
  message: string;
  contact?: ChatsArrType;
};

export type ChatContentType = {
  hidden: boolean;
  mdAbove: boolean;
  store: any;
  sidebarWidth: number;
  dispatch: Dispatch<any>;
  statusObj: StatusObjType;
  userProfileRightOpen: boolean;
  createTicketRightOpen: boolean;
  questionBankRightOpen: boolean;
  handleLeftSidebarToggle: () => void;
  getInitials: (val: string) => string;
  sendMsg: (params: SendMsgParamsType) => void;
  handleUserProfileRightSidebarToggle: () => void;
  handleCreateTicketRightSidebarToggle: () => void;
  handleQuestionBankRightSidebarToggle: () => void;
  socket?: any;
};

export type ChatSidebarLeftType = {
  hidden: boolean;
  mdAbove: boolean;
  store: any;
  sidebarWidth: number;
  userStatus: StatusType;
  dispatch: Dispatch<any>;
  leftSidebarOpen: boolean;
  statusObj: StatusObjType;
  enableSound: boolean;
  handleSoundToggle: () => void;
  userProfileLeftOpen: boolean;
  removeSelectedChat: () => void;
  selectChat: (id: any) => void;
  handleLeftSidebarToggle: () => void;
  getInitials: (val: string) => string;
  setUserStatus: (status: StatusType) => void;
  handleUserProfileLeftSidebarToggle: () => void;
  formatDateToMonthShort: (value: string, toTimeForCurrentDay: boolean) => void;
  addActiveMessage?: any;
  clearActiveMessage?: any;
  updateActiveConversation?: any;
};

export type UserProfileLeftType = {
  hidden: boolean;
  store: ChatStoreType;
  sidebarWidth: number;
  userStatus: StatusType;
  statusObj: StatusObjType;
  userProfileLeftOpen: boolean;
  setUserStatus: (status: StatusType) => void;
  handleUserProfileLeftSidebarToggle: () => void;
};

export type UserProfileRightType = {
  hidden: boolean;
  store: ChatStoreType;
  sidebarWidth: number;
  statusObj: StatusObjType;
  userProfileRightOpen: boolean;
  getInitials: (val: string) => string;
  handleUserProfileRightSidebarToggle: () => void;
};

export type CreateTicketType = {
  hidden: boolean;
  store: ChatStoreType;
  sidebarWidth: number;
  statusObj: StatusObjType;
  createTicketRightOpen: boolean;
  getInitials: (val: string) => string;
  handleCreateTicketRightSidebarToggle: () => void;
};

export type QuestionBankType = {
  hidden: boolean;
  store: ChatStoreType;
  sidebarWidth: number;
  statusObj: StatusObjType;
  questionBankRightOpen: boolean;
  getInitials: (val: string) => string;
  handleQuestionBankRightSidebarToggle: () => void;
  socket?: any;
};

export type SendMsgComponentType = {
  store: ChatStoreType;
  dispatch: Dispatch<any>;
  sendMsg: (params: SendMsgParamsType) => void;
};

export type ChatLogType = {
  hidden: boolean;
  data: {
    chat: ChatsObj;
    contact: ContactType;
    userContact: ProfileUserType;
  };
};

export type MessageType = {
  time: string | Date;
  message: string;
  sender: any;
  feedback: MsgFeedbackType;
  type: string;
  senderId?: string;
  value?: string;
  [key : string]: any;
};

export type ChatLogChatType = {
  msg?: string;
  time: string | Date;
  feedback?: MsgFeedbackType;
  type?: string;
  [key : string]: any;
};

export type FormattedChatsType = {
  senderId: any;
  messages: ChatLogChatType[];
};

export type MessageGroupType = {
  senderId: any;
  messages: ChatLogChatType[];
};
