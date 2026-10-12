// ** React Imports
import {
  createContext,
  useEffect,
  useState,
  ReactNode,
  useContext,
  useRef,
} from 'react';

// ** Next Import
import { useRouter } from 'next/router';

// ** Axios
import axios from 'axios';

// ** Config
import authConfig from 'src/configs/auth';
import { homeRouteForRole } from 'src/utils/role-tabs';
import { ChatContext } from './SocketContext';
import { toast } from 'react-hot-toast';
import { addUser, addUserData } from 'src/store/apps/user';
import { useDispatch, useStore } from 'react-redux';
import { currentAlertClient, getAlertClient } from 'src/services/alerts/alertClient';
import { openHandoverAlert } from 'src/services/alerts/openAlert';
import { clearAlerts } from 'src/store/apps/alerts';

import { AppDispatch, RootState } from 'src/store';
import {
  selectChat,
  getActiveconversations,
  pushToActiveConversations,
  loadOldChats,
  addActiveMessage,
  clearActiveMessage,
  updateActiveConversation,
  updateConversationChats,
  handleChatContext,
  renameVisitor,
} from 'src/store/apps/conversation';
import {
  getInboxChannels,
  inboxMessageReceived,
  inboxMessageStatusReceived,
  inboxSocketGap,
  inboxThreadUpdated,
  inboxAgentTyping,
} from 'src/store/apps/inbox';
import { setSrMe, srRealtime, srSocketGap } from 'src/store/apps/crm-service-requests';
// ** Types
import {
  AuthValuesType,
  RegisterParams,
  LoginParams,
  ErrCallbackType,
  UserDataType,
} from './types';
import Axios from 'src/helper/Axios';
// ** Defaults
const defaultProvider: AuthValuesType = {
  user: null,
  loading: true,
  setUser: () => null,
  setLoading: () => Boolean,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  register: () => Promise.resolve(),
};

const AuthContext = createContext(defaultProvider);

type Props = {
  children: ReactNode;
};

const AuthProvider = ({ children }: Props) => {
  // ** States
  const [user, setUser] = useState<UserDataType | null>(defaultProvider.user);
  const [loading, setLoading] = useState<boolean>(defaultProvider.loading);

  // ** Hooks
  const router = useRouter();

  const chatContext = useContext(ChatContext);
  const dispatch = useDispatch<AppDispatch>();
  const store = useStore<RootState>();
  // useEffect(() => {
  //   dispatch(getActiveconversations());
  // }, []);
  useEffect(() => {
    const initAuth = async (): Promise<void> => {
      const storedToken = window.localStorage.getItem(
        authConfig.storageTokenKeyName,
      )!;
      if (storedToken) {
        setLoading(true);
        await Axios.get(authConfig.meEndpoint, {
          headers: {
            Authorization: storedToken,
          },
        })
          .then(async (response) => {
            chatContext.init(storedToken);
            setUser({ ...response.data });
            dispatch(addUserData(response.data))
            window.localStorage.setItem(
              'userData',
              JSON.stringify(response.data),
            );
            const messageObservable = chatContext.onVisitorMessage();
            const observable = chatContext.onNewVisitor();
            dispatch(handleChatContext(chatContext));
            // Sounds and notifications are decided ONLY by the alert client:
            // handover sound on `inbox:handover-requested`, a soft notification
            // for visitor messages in conversations this user owns. Ordinary bot
            // and AI traffic is silent.
            const alertClient = getAlertClient(dispatch, store.getState);
            alertClient.openAlert = (id) => openHandoverAlert(id);
            alertClient.start(chatContext, response.data);

            messageObservable.subscribe((data) => {
              // `message` is emitted only to the agent assigned to this visitor
              // (sendMessageToAgent), so receiving it means this user owns it.
              void alertClient.onMessage(
                {
                  id: data?.message?.id,
                  conversationId: data?.conversationId,
                  time: data?.message?.time,
                  senderRole: data?.message?.senderRole ?? 'visitor',
                  preview: data?.message?.value,
                  type: data?.message?.type,
                },
                true,
              );
              dispatch(updateConversationChats(data));
            });

            observable?.subscribe(async (data: any) => {
              console.log('pushing new conversation', data);

              await dispatch(pushToActiveConversations(data));
              // R9.2: the payload's chats are not the history. Load the full
              // history from the server right away, no "load old chats" click.
              const id = data?.conversationId || data?._id;
              if (id) dispatch(loadOldChats(id));
            });
            // The visitor told the bot their name: rename the active chat
            // without a reload (crm-plugins-service-desk R4.5).
            chatContext.onVisitorUpdated?.().subscribe((data: any) => {
              if (data?.conversationId && data?.name) dispatch(renameVisitor(data));
            });

            // ** Omnichannel inbox (WhatsApp / Telegram / Instagram / …).
            //
            // Subscribed here, alongside the widget events, because this is
            // where the single shared socket is initialised — a second
            // subscription point would mean a second connection.
            chatContext.onInboxMessage().subscribe((event: any) => {
              if (!event?.threadId) return;
              // Notify only for a visitor-authored message on a thread this
              // user owns right now (Sender_Role, not `direction`, which legacy
              // widget rows lack — that gap made every bot/AI reply ping).
              const myId = String(response.data?._id ?? '');
              const thread = event?.thread;
              const ownedByMe =
                thread?.handledByAgent === true &&
                !!myId &&
                String(thread?.assignedAgent?.id ?? '') === myId;
              void alertClient.onMessage(
                {
                  id: event?.message?.id,
                  conversationId: event?.message?.conversationId,
                  threadId: event.threadId,
                  time: event?.message?.time,
                  senderRole: event?.message?.senderRole,
                  preview: event?.message?.message,
                  visitorName: thread?.name,
                  type: event?.message?.type,
                },
                ownedByMe,
              );
              dispatch(inboxMessageReceived(event));
            });

            chatContext.onInboxThreadUpdated().subscribe((event: any) => {
              dispatch(inboxThreadUpdated(event));
            });

            // crm-incident-handover R8.6: "<name> is replying…" for other viewers.
            chatContext.onInboxAgentTyping().subscribe((event: any) => {
              dispatch(inboxAgentTyping(event));
            });

            // R7.3: an org admin took a chat this user was handling.
            chatContext.onInboxOwnershipOverridden().subscribe((event: any) => {
              toast(`${event?.actorName || 'An admin'} took over one of your chats.`, { icon: '🔁' });
            });

            chatContext.onInboxMessageStatus().subscribe((event: any) => {
              dispatch(inboxMessageStatusReceived(event));
            });

            // A chat-list sync created threads (a conversation that predates this
            // process, or one started on the phone). Refetch the tab counts so it
            // becomes reachable without a reload.
            chatContext.onInboxChannelsChanged().subscribe(() => {
              dispatch(getInboxChannels());
            });

            // Reconnect gap recovery. Messages that arrived while the socket was
            // down were never emitted to this tab, and no other code path would
            // ever surface them, so the channel counts are refetched on every
            // reconnect. `reconnect` (not `connect`) fires only on a genuine
            // re-establish, so the initial connect does not double-fetch.
            chatContext.onReconnect().subscribe(() => {
              dispatch(inboxSocketGap());
              dispatch(getInboxChannels());
              // Board pushes missed while offline: open board/drawer refetch.
              dispatch(srSocketGap());
            });

            // Live service desk board and drawer (crm-plugins-service-desk R18.2).
            dispatch(setSrMe(response.data?._id ? String(response.data._id) : null));
            chatContext.onServiceRequestChanged().subscribe((event: any) => {
              if (event?.id) dispatch(srRealtime(event));
            });

            // Seed the channel tabs so a badge is correct on first paint
            // rather than only after the first live message.
            dispatch(getInboxChannels());

            setLoading(false);
          })
          .catch((error) => {
            localStorage.removeItem('userData');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('accessToken');
            setUser(null);
            setLoading(false);
            if (
              authConfig.onTokenExpiration === 'logout' &&
              !router.pathname.includes('login')
            ) {
              router.replace('/login');
            }
            console.log({ error });
          });
      } else {
        setLoading(false);
      }
    };

    initAuth();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = (
    params: LoginParams,
    errorCallback?: ErrCallbackType,
  ) => {
    // The backend resolves the role from the stored user; no role is sent.
    Axios.post(authConfig.loginEndpoint, params)
      .then(async (res) => {
        window.localStorage.setItem(
          authConfig.storageTokenKeyName,
          res.data.accessToken,
        );
        window.localStorage.setItem('refreshToken', res.data.refreshToken);
      })
      .then(() => {
        Axios.get(authConfig.meEndpoint).then(async (response) => {
          const returnUrl = router.query.returnUrl;
          dispatch(addUserData(response.data))
          setUser({ ...response.data });
          window.localStorage.setItem(
            'userData',
            JSON.stringify(response.data),
          );

          // Role-based landing: super admin -> console, agent -> inbox,
          // org admin/manager -> dashboard.
          const home = homeRouteForRole(response.data?.role);
          const redirectURL =
            returnUrl && returnUrl !== '/' ? returnUrl : home;

          router.replace(redirectURL as string);
        });
      })
      .catch((err) => {
        if (errorCallback) errorCallback(err);
      });
  };

  const handleLogout = () => {
    setUser(null);
    currentAlertClient()?.stop();
    dispatch(clearAlerts());
    // Clear every session artefact, including a stashed super-admin session
    // from impersonation, so the next user on this browser starts clean.
    [
      'userData',
      authConfig.storageTokenKeyName,
      'refreshToken',
      'impersonatingOrg',
      'superAdminAccessToken',
      'superAdminRefreshToken',
    ].forEach((k) => window.localStorage.removeItem(k));
    router.push('/login');
  };

  const handleRegister = (
    params: RegisterParams,
    errorCallback?: ErrCallbackType,
  ) => {
    axios
      .post(authConfig.registerEndpoint, params)
      .then((res) => {
        if (res.data.error) {
          if (errorCallback) errorCallback(res.data.error);
        } else {
          handleLogin({ email: params.email, password: params.password });
        }
      })
      .catch((err: { [key: string]: string }) =>
        errorCallback ? errorCallback(err) : null,
      );
  };

  const values = {
    user,
    loading,
    setUser,
    setLoading,
    login: handleLogin,
    logout: handleLogout,
    register: handleRegister,
  };

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthProvider };
