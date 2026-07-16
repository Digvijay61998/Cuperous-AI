// ** Redux Imports
import { Dispatch } from 'redux';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// ** Axios Imports
import Axios from 'src/helper/Axios';

// ** Toasters Imports
import { toast } from 'react-hot-toast';

interface Redux {
  getState: any;
  dispatch: Dispatch<any>;
}

interface updateTicketInterface {
  id: number | string;
  data: any;
}
//for create
export type ticketDataType = {
  bot: any;
  subject: string;
  agents?: any;
  priority: string;
  tags: any;
  description?: string;
  visitor?: string;
  admin?: string;
  conversationId?: string;
};

interface DataParams {
  skip?: number;
  limit?: number;
  bot?: string;
  tags?: any[];
  priority?: string;
  status?: string;
  startDate?: any;
  endDate?: any;
}

// ** Fetch Tickets
export const fetchAllTicketsData = createAsyncThunk(
  'service-Request/tickets',
  async (query: DataParams = {}) => {
    try {
      let urlString = 'tickets';
      if (query) {
        if (query.skip) {
          urlString += `?skip=${query.skip}`;
        } else {
          urlString += `?`;
        }
        if (query.limit) {
          urlString += `&limit=${query.limit}`;
        }
        if (query?.bot) {
          urlString += `&bot=${query?.bot}`;
        }
        if (query.priority) {
          urlString += `&priority=${query.priority}`;
        }
        if (query.status) {
          urlString += `&status=${query.status}`;
        }
        if (query.startDate) {
          urlString += `&startDate=${query.startDate}`;
        }
        if (query.endDate) {
          urlString += `&endDate=${query.endDate}`;
        }
        if (query.tags && Array.isArray(query.tags) && query.tags.length > 0) {
          query.tags.forEach((tag) => {
            urlString += `&tags=${tag}`;
          });
        }
      }
      const response = await Axios.get(urlString);
      return response.data;
    } catch (error: any) {
      console.log('Ticket list API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

// ** Fetch Tickets By Id
export const getTicketDataById = createAsyncThunk(
  'service-Request/ticketsById',
  async (ticketId: string | any) => {
    try {
      const response = await Axios.get(`/tickets/${ticketId}/`);
      return response.data;
    } catch (error: any) {
      console.log('Ticket details API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

// ** Update specific Ticket
export const updateTicket = createAsyncThunk(
  'agent/updateAgent',
  async (
    { id, data }: updateTicketInterface,
    { getState, dispatch }: Redux,
  ) => {
    try {
      const response = await Axios.patch(`tickets/${id}`, data);

      toast.success('Ticket updated successfully');
      dispatch(getTicketDataById(id));
      dispatch(fetchAllTicketsData());
      return response.data;
    } catch (error: any) {
      console.log('Update ticket API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

export const getChatLogsById = createAsyncThunk(
  'chat/getChatLogsById',
  async (id: number | string) => {
    try {
      const response = await Axios.get('/conversation/' + id);

      return response.data;
    } catch (error: any) {
      console.log('Chat details API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

// Create Tickets
export const CreateTicketData = createAsyncThunk(
  'service-Request/tickets',
  async (data: any, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.post('tickets', { ...data });

      toast.success('Ticket added successfully');
      dispatch(fetchAllTicketsData());
      //dispatch(fetchBotData(getState().user.params))

      // localStorage.setItem("botID",response.data?._id)
      // console.log(response.data)
      return response.data;
    } catch (error: any) {
      console.log('Add new ticket API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

// mark resolved tickets or closed tickets
export const markResolvedTicketById = createAsyncThunk(
  'service-Request/resolveTicketsById',
  async (ticketId: string | any, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.get(
        `/tickets/mark-as-resolved?id=${ticketId}`,
      );

      toast.success('Ticket resolved successfully');

      dispatch(getTicketDataById(ticketId));
      dispatch(fetchAllTicketsData());
      return response.data;
    } catch (error: any) {
      console.log('Resolve Ticket API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

// mark deferred tickets
export const markDeferredTicketById = createAsyncThunk(
  'service-Request/deferredTicketsById',
  async (ticketId: string | any, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.get(
        `/tickets/mark-as-deferred?id=${ticketId}`,
      );

      toast.success('Ticket deferred successfully');

      dispatch(getTicketDataById(ticketId));
      dispatch(fetchAllTicketsData());
      return response.data;
    } catch (error: any) {
      console.log('Defer Ticket API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

// assign tickets to agents
export const assignTicketById = createAsyncThunk(
  'service-Request/assignTicketsById',
  async (ticketId: string | any, { getState, dispatch }: Redux) => {
    try {
      const response = await Axios.get(`/tickets/assign-to-me?id=${ticketId}`);

      toast.success('Ticket assigned successfully');

      dispatch(getTicketDataById(ticketId));
      dispatch(fetchAllTicketsData());
      return response.data;
    } catch (error: any) {
      console.log('Assign Ticket API:Error >>>>', error);
      toast.error(error.response.data.message || error.message || error);
    }
  },
);

export const botsSlice = createSlice({
  name: 'serviceRequest',
  initialState: {
    ticketList: [],
    ticketData: {},
    chatLogData: {},
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchAllTicketsData.fulfilled, (state, action) => {
      state.ticketList = action.payload.data;
    });

    builder.addCase(getTicketDataById.fulfilled, (state, action) => {
      state.ticketData = action.payload;
    });
    builder.addCase(getChatLogsById.fulfilled, (state, action) => {
      state.chatLogData = action.payload;
    });
  },
});

export default botsSlice.reducer;
