// ** React Imports
import { ReactNode } from 'react';

// ** Next Imports
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Router, useRouter } from 'next/router';

// ** Store Imports
import { Provider } from 'react-redux';
import { RootState, store } from 'src/store';

// ** Loader Import
import NProgress from 'nprogress';

// ** Emotion Imports
import type { EmotionCache } from '@emotion/cache';
import { CacheProvider } from '@emotion/react';

// ** Config Imports
import { defaultACLObj } from 'src/configs/acl';
import 'src/configs/i18n';
import themeConfig from 'src/configs/themeConfig';


// ** Third Party Import
import { Toaster } from 'react-hot-toast';

// ** Component Imports
import AclGuard from 'src/@core/components/auth/AclGuard';
import AuthGuard from 'src/@core/components/auth/AuthGuard';
import GuestGuard from 'src/@core/components/auth/GuestGuard';
import WindowWrapper from 'src/@core/components/window-wrapper';
import ThemeComponent from 'src/@core/theme/ThemeComponent';
import UserLayout from 'src/layouts/UserLayout';

// ** Spinner Import
import Spinner from 'src/@core/components/spinner';

// ** Contexts
import {
  SettingsConsumer,
  SettingsProvider
} from 'src/@core/context/settingsContext';
import { AuthProvider } from 'src/context/AuthContext';

// ** Styled Components
import ReactHotToast from 'src/@core/styles/libs/react-hot-toast';

// ** Utils Imports
import { createEmotionCache } from 'src/@core/utils/create-emotion-cache';

// ** Prismjs Styles
import 'prismjs';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/themes/prism-tomorrow.css';
import 'reactflow/dist/style.css';
// ** React Perfect Scrollbar Style
import 'react-perfect-scrollbar/dist/css/styles.css';
import { ChatProvider } from 'src/context/SocketContext';

import 'react-slideshow-image/dist/styles.css';
import BlankLayout from 'src/@core/layouts/BlankLayout';
import 'src/iconify-bundle/icons-bundle-react';
import NotAuthorized from 'src/pages/401';
// ** Global css styles
import { useSelector } from 'react-redux';
import { access } from 'src/helper/Access';
import { AccessTypesEnum } from 'src/utils';
import '../../styles/globals.css';
// ** Extend App Props with Emotion
type ExtendedAppProps = AppProps & {
  Component: NextPage;
  emotionCache: EmotionCache;
};

type GuardProps = {
  authGuard: boolean;
  guestGuard: boolean;
  children: ReactNode;
};

const clientSideEmotionCache = createEmotionCache();

// ** Pace Loader
if (themeConfig.routingLoader) {
  Router.events.on('routeChangeStart', () => {
    NProgress.start();
  });
  Router.events.on('routeChangeError', () => {
    NProgress.done();
  });
  Router.events.on('routeChangeComplete', () => {
    NProgress.done();
  });
}

const Guard = ({ children, authGuard, guestGuard }: GuardProps) => {
  if (guestGuard) {
    return <GuestGuard fallback={<Spinner />}>{children}</GuestGuard>;
  } else if (!guestGuard && !authGuard) {
    return <>{children}</>;
  } else {
    return <AuthGuard fallback={<Spinner />}>{children}</AuthGuard>;
  }
};
const Redirect = () => {
  const router = useRouter();
  const { userData } = useSelector((state: RootState) => state.user);

  if (!access(userData.role, AccessTypesEnum.READ, router.route)) {
    return (
      <BlankLayout>
        <NotAuthorized />
      </BlankLayout>
    );
  }
};
// ** Configure JSS & ClassName
const App = (props: ExtendedAppProps) => {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;

  // Variables
  const contentHeightFixed = Component.contentHeightFixed ?? false;
  const getLayout =
    Component.getLayout ??
    ((page) => (
      <UserLayout contentHeightFixed={contentHeightFixed} >
        {page}
      </UserLayout>
    ));

  const setConfig = Component.setConfig ?? undefined;

  const authGuard = Component.authGuard ?? true;

  const guestGuard = Component.guestGuard ?? false;

  const aclAbilities = Component.acl ?? defaultACLObj;

  return (
    <Provider store={store}>
      <CacheProvider value={emotionCache}>
        <Head>
          {/* Favicon/manifest tags live in src/pages/_document.tsx so they are
              emitted once for every page. */}
          <title>{`${themeConfig.templateName}`}</title>
          <meta
            name="description"
            content={`${themeConfig.templateName} – A customer management, customer onboarding, financial chatbot`}
          />
          <meta name="keywords" content="Chatbot, JarCube, AI Chatbot," />
          <meta name="viewport" content="initial-scale=1, width=device-width" />
        </Head>

        <ChatProvider>
          <AuthProvider>
            <SettingsProvider
              {...(setConfig ? { pageSettings: setConfig() } : {})}
            >
              <SettingsConsumer>
                {({ settings }) => {
                  return (
                    <ThemeComponent settings={settings}>
                      <WindowWrapper>
                        <Guard authGuard={authGuard} guestGuard={guestGuard}>
                          <AclGuard
                            aclAbilities={aclAbilities}
                            guestGuard={guestGuard}
                          >
                            {getLayout(<Component {...pageProps} />)}
                          </AclGuard>
                        </Guard>
                      </WindowWrapper>
                      <ReactHotToast>
                        <Toaster
                          position={settings.toastPosition}
                          toastOptions={{ className: 'react-hot-toast' }}
                        />
                        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
                      </ReactHotToast>
                    </ThemeComponent>
                  );
                }}
              </SettingsConsumer>
            </SettingsProvider>
          </AuthProvider>
        </ChatProvider>
      </CacheProvider>
    </Provider>
  );
};

export default App;
