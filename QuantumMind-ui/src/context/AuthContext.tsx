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
import { ChatContext } from './SocketContext';
import { addUser, addUserData } from 'src/store/apps/user';
import { useDispatch, useSelector } from 'react-redux';
import pushNotification from 'src/utils/notification';

import { AppDispatch, RootState } from 'src/store';
import {
  selectChat,
  getActiveconversations,
  pushToActiveConversations,
  addActiveMessage,
  clearActiveMessage,
  updateActiveConversation,
  updateConversationChats,
  handleChatContext,
} from 'src/store/apps/conversation';
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
  const enSound = useRef<boolean>(true);
  const { enableSound } = useSelector(
    (state: RootState) => state.conversations,
  );
  const dispatch = useDispatch<AppDispatch>();
  useEffect(() => {
    enSound.current = enableSound;
  }, [enableSound]);
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
            messageObservable.subscribe((data) => {
              // add sound here
              if (enSound.current) {
                var snd = new Audio('/sound.mpeg');
                snd.play();
              }

              pushNotification(
                data?.message?.value,
                'New Message',
                data?.message?.type || 'text',
              );
              dispatch(updateConversationChats(data));
            });

            observable?.subscribe((data) => {
              console.log('pushing new conversation', data);

              dispatch(pushToActiveConversations(data));
            });

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
    Axios.post(authConfig.loginEndpoint, { ...params, role: 'admin' })
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

          const redirectURL = returnUrl && returnUrl !== '/' ? returnUrl : '/';

          router.replace(redirectURL as string);
        });
      })
      .catch((err) => {
        if (errorCallback) errorCallback(err);
      });
  };

  const handleLogout = () => {
    setUser(null);
    window.localStorage.removeItem('userData');
    window.localStorage.removeItem(authConfig.storageTokenKeyName);
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
