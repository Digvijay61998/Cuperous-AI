// ** Redux Imports
import { Dispatch } from 'redux';
import { createSlice, createAsyncThunk, current } from '@reduxjs/toolkit';

// ** Axios Imports
import Axios from 'src/helper/Axios';

// ** Toasters Imports
import { toast } from 'react-hot-toast';
import { ChatMessage, onNewVisitorAdded } from 'src/services/socket.services';

interface Redux {
  getState: any;
  dispatch: Dispatch<any>;
}
interface getAllConversationInterface {
  status?: string;
  type?: string;
}
export const getActiveconversations = createAsyncThunk(
  'conversations/getActiveConversations',
  async () => {
    try {
      const response = await Axios.get(`/conversation/active-conversations`);
      return response.data;
    } catch (error: any) {
      console.log('Conversation list API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

export const handleCloseConversation = createAsyncThunk(
  'conversations/handleCloseConversation',
  async (id: number | string) => {
    try {
      const response = await Axios.put(`/conversation/close/${id}`);
      return response.data;
    } catch (error: any) {
      console.log('Conversation list API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

export const pushToActiveConversations = createAsyncThunk(
  'conversations/pushToActiveConversations',
  async (data: onNewVisitorAdded | any, { getState }: Redux) => {
    return data;
  },
);

// ** Fetch Users
export const getconversations = createAsyncThunk(
  'conversations/getconversations',
  async (data: getAllConversationInterface = {}) => {
    try {
      let queryString = '?';
      if (data?.status) {
        queryString += `status=${data.status}&`;
      }
      if (data?.type) {
        queryString += `type=${data.type}&`;
      }
      const response = await Axios.get(`conversation${queryString}`);
      return response.data;
    } catch (error: any) {
      console.log('Conversation list API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

export const selectChat = createAsyncThunk(
  'appChat/selectChat',
  async (id: number | string) => {
    try {
      const response = await Axios.get('/conversation/' + id);

      return response.data;
    } catch (error: any) {
      console.log('Conversation detail API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);
export const loadOldChats = createAsyncThunk(
  'appChat/oldChats',
  async (id: number | string) => {
    try {
      const response = await Axios.get('/conversation/' + id);

      return response.data;
    } catch (error: any) {
      console.log('Conversation detail API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

export const updateConversationChats = createAsyncThunk(
  'appChat/updateConversationChats',
  async (data: ChatMessage | any, { getState }: Redux) => {
    return data;
  },
);

export const selectedActiveConversation = createAsyncThunk(
  'appChat/selectedActiveConversation',
  async (data: any, { getState }: Redux) => {
    return data;
  },
);
export const visitedChat = createAsyncThunk(
  'appChat/visitedChat',
  async (data: any, { getState }: Redux) => {
    return data;
  },
);
export const removedChat = createAsyncThunk(
  'appChat/removedChat',
  async (data: any, { getState }: Redux) => {
    return data;
  },
);
export const getActiveSelectedChat = createAsyncThunk(
  'appChat/getActiveSelectedChat',
  async (data: any, { getState }: Redux) => {
    return data;
  },
);
export const conversationsSlice = createSlice({
  name: 'conversations',
  initialState: {
    list: [],
    length: {},
    selectedConversation: null as any,
    messages: [] as any,
    visitors: [] as any,
    activeConversations: [] as any,
    activeChatId: null as any,
    activeSelectedChat: null as any,
    selectedVisitorId: null as any,
    chatContext: null as any,
    enableSound: true,
    isLoadingOldChat: false,
  },
  reducers: {
    removedSelectedConversation: (state) => {
      state.selectedConversation = null;
    },
    handleSoundToggle: (state) => {
      state.enableSound = !state.enableSound;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    addVisitor: (state, action) => {
      state.visitors.push(action.payload);
    },
    handleChatContext: (state, action) => {
      state.chatContext = action.payload;
    },
    clearMessages: (state) => {
      state.messages = state.messages.slice(0, 1);
    },
    addActiveMessage: (state, action) => {
      state.activeChatId = action.payload.id;
      state.selectedVisitorId = action.payload.visitorId;
    },
    clearActiveMessage: (state) => {
      // state.activeChat = [];
    },
    updateActiveConversation: (state, action) => {
      if (state.activeConversations.length > 0)
        state.activeConversations[action.payload.index] = action.payload.data;
    },
    removedSelectedChat: (state, action) => {
      state.activeSelectedChat = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getActiveSelectedChat.fulfilled, (state, action) => {
      const conversation = state.activeConversations.find(
        (chat: any) => chat._id === action.payload,
      );
      if (conversation) {
        state.activeSelectedChat = conversation;
      }
    });

    builder.addCase(getconversations.fulfilled, (state, action) => {
      state.list = action.payload;
      state.length = state?.list?.length;
    });
    builder.addCase(selectChat.fulfilled, (state, action) => {
      state.selectedConversation = action.payload;
    });

    builder.addCase(getActiveconversations.fulfilled, (state, action) => {
      state.activeConversations = action.payload;
    });

    builder.addCase(pushToActiveConversations.fulfilled, (state, action) => {
      const conversation = state.activeConversations.find(
        (conv: any) => conv._id === action.payload?._id,
      );
      let conversations;
      if (!conversation) {
        conversations = [action.payload, ...state.activeConversations];
      } else {
        conversations = [
          conversation,
          ...state.activeConversations.filter(
            (conv: any) => conv._id !== action.payload?._id,
          ),
        ];
      }
      state.activeConversations = conversations;
    });

    builder.addCase(updateConversationChats.fulfilled, (state, action) => {
      //  get the last message
      const findMsgId = state?.activeConversations
        ? current(state.activeConversations).find(
            (conv: any) => conv.lastMessage?.id === action.payload.message?.id,
          )
        : undefined;
      if (findMsgId === undefined) {
        let conversation: any = current(state.activeConversations).map(
          (conv: any) => {
            if (conv._id === action.payload?.conversationId) {
              const newConv = {
                ...conv,
                chats: conv?.chats
                  ? [...conv.chats, action.payload?.message].filter(
                      (v, i, a) => a.findIndex((t) => t.id === v.id) === i,
                    )
                  : [action.payload?.message],
                lastMessage: {
                  message: action.payload?.message?.value,
                  ...action.payload?.message,
                },
                unseenMsgs:
                  action.payload?.message?.sender === 'agent'
                    ? 0
                    : Number(conv?.unseenMsgs)
                    ? Number(conv.unseenMsgs) + 1
                    : 1,
              };
              if (action.payload.conversationId === state.activeChatId) {
                state.activeSelectedChat = newConv;
              }
              return newConv;
            } else {
              return conv;
            }
          },
        );
        state.activeConversations = conversation;
      }
    });
    builder.addCase(visitedChat.fulfilled, (state, action) => {
      const conversations = current(state.activeConversations).map(
        (conv: any, index: number) => {
          if (conv._id === action.payload.id) {
            if (conv?.unseenMsgs) {
              return {
                ...conv,
                unseenMsgs: 0,
              };
            } else {
              return {
                ...conv,
              };
            }
          } else {
            return { ...conv };
          }
        },
      );
      state.activeConversations = conversations;
    });
    builder.addCase(removedChat.fulfilled, (state, action) => {
      state.activeConversations = state.activeConversations.filter(
        (conv: any) => conv._id !== action.payload.id,
      );
      state.activeChatId = null;
    });
    // load old chat message

    builder.addCase(loadOldChats.pending, (state) => {
      state.isLoadingOldChat = true;
    });
    // add old chat message into the active chat
    builder.addCase(loadOldChats.fulfilled, (state, action) => {
      const conversations = current(state.activeConversations).map(
        (conv: any, index: number) => {
          if (conv._id === action.payload._id) {
            // remove dublicate chats
            const chats = [...action.payload.chats, ...conv.chats].filter(
              (v, i, a) => a.findIndex((t) => t.id === v.id) === i,
            );
            state.activeSelectedChat = {
              ...conv,
              chats,
            };
            return {
              ...conv,
              chats,
            };
          } else {
            return { ...conv };
          }
        },
      );
      state.activeConversations = conversations;

      state.isLoadingOldChat = false;
    });
  },
});

export const {
  addMessage,
  clearMessages,
  addVisitor,
  addActiveMessage,
  clearActiveMessage,
  updateActiveConversation,
  removedSelectedChat,
  removedSelectedConversation,
  handleChatContext,
  handleSoundToggle,
} = conversationsSlice.actions;

export default conversationsSlice.reducer;
