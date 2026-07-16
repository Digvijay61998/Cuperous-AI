// ** React Imports

import { useEffect, useRef, useContext, useState, ReactNode } from 'react';
// ** MUI Imports
import { Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// ** Layout Imports
// !Do not remove this Layout import
import Layout from 'src/@core/layouts/Layout';

// ** Navigation Imports
import VerticalNavItems from 'src/navigation/vertical';
import HorizontalNavItems from 'src/navigation/horizontal';
import { ChatContext } from 'src/context/SocketContext';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
// ** Component Import
// Uncomment the below line (according to the layout type) when using server-side menu
// import ServerSideVerticalNavItems from './components/vertical/ServerSideNavItems'
// import ServerSideHorizontalNavItems from './components/horizontal/ServerSideNavItems'

import VerticalAppBarContent from './components/vertical/AppBarContent';
import HorizontalAppBarContent from './components/horizontal/AppBarContent';
import pushNotification from 'src/utils/notification';
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
// ** Hook Import
import { useSettings } from 'src/@core/hooks/useSettings';

interface Props {
  children: ReactNode;
  contentHeightFixed: boolean;
}

const UserLayout = ({ children, contentHeightFixed }: Props) => {
  // ** Hooks
  const { settings, saveSettings } = useSettings();

  // ** Vars for server side navigation
  // const { menuItems: verticalMenuItems } = ServerSideVerticalNavItems()
  // const { menuItems: horizontalMenuItems } = ServerSideHorizontalNavItems()

  /**
   *  The below variable will hide the current layout menu at given screen size.
   *  The menu will be accessible from the Hamburger icon only (Vertical Overlay Menu).
   *  You can change the screen size from which you want to hide the current layout menu.
   *  Please refer useMediaQuery() hook: https://mui.com/material-ui/react-use-media-query/,
   *  to know more about what values can be passed to this hook.
   *  ! Do not change this value unless you know what you are doing. It can break the template.
   */
  const hidden = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'));

  if (hidden && settings.layout === 'horizontal') {
    settings.layout = 'vertical';
  }
  const socketRef = useRef<any>(null);
  const chatContext = useContext(ChatContext);
  const enSound = useRef<boolean>(true);
  const { enableSound } = useSelector(
    (state: RootState) => state.conversations,
  );
  const dispatch = useDispatch<AppDispatch>();

  // useEffect(() => {
  //   enSound.current = enableSound;
  // }, [enableSound]);
  // useEffect(() => {
  //   dispatch(getActiveconversations());
  // }, []);
  // useEffect(() => {
  //   if (chatContext) {
  //     chatContext.init();
  //     // add socketRef to current socket
  //     socketRef.current = chatContext;
  //     dispatch(handleChatContext(chatContext));
  //     const messageObservable = chatContext.onVisitorMessage();
  //     const observable = chatContext.onNewVisitor();
  //     messageObservable.subscribe((data) => {
  //       // add sound here
  //       if (enSound.current) {
  //         var snd = new Audio('/sound.mpeg');
  //         snd.play();
  //       }
  //       console.log('data', data);
  //       pushNotification(
  //         data?.message?.value,
  //         'New Message',
  //         data?.message?.type || 'text',
  //       );
  //       dispatch(updateConversationChats(data));
  //     });

  //     observable?.subscribe((data) => {
  //       console.log('pushing new conversation', data);

  //       dispatch(pushToActiveConversations(data));
  //     });
  //   }
  // }, [chatContext]);
  // ** Props
  // const ABCD: string = 'ABCD'

  return (
    <Layout
      hidden={hidden}
      settings={settings}
      saveSettings={saveSettings}
      contentHeightFixed={contentHeightFixed}
      verticalLayoutProps={{
        navMenu: {
          navItems: VerticalNavItems(),

          // Uncomment the below line when using server-side menu in vertical layout and comment the above line
          // navItems: verticalMenuItems
        },
        appBar: {
          content: (props) => (
            <VerticalAppBarContent
              hidden={hidden}
              settings={settings}
              saveSettings={saveSettings}
              toggleNavVisibility={props.toggleNavVisibility}
            />
          ),
        },
      }}
      {...(settings.layout === 'horizontal' && {
        horizontalLayoutProps: {
          navMenu: {
            navItems: HorizontalNavItems(),

            // Uncomment the below line when using server-side menu in horizontal layout and comment the above line
            // navItems: horizontalMenuItems
          },
          appBar: {
            content: () => (
              <HorizontalAppBarContent
                hidden={hidden}
                settings={settings}
                saveSettings={saveSettings}
              />
            ),
          },
        },
      })}
    >
      {children}
    </Layout>
  );
};

export default UserLayout;
