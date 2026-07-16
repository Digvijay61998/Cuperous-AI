// ** React Import
import { useEffect, useRef, useContext, useState } from 'react';

// ** Type Import
import { LayoutProps } from 'src/@core/layouts/types';

// ** Layout Components
import VerticalLayout from './VerticalLayout';
import HorizontalLayout from './HorizontalLayout';
import { ChatContext } from 'src/context/SocketContext';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from 'src/store';
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
const Layout = (props: LayoutProps) => {
  const socketRef = useRef<any>(null);
  const chatContext = useContext(ChatContext);
  const enSound = useRef<boolean>(true);
  const { enableSound } = useSelector(
    (state: RootState) => state.conversations,
  );
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    enSound.current = enableSound;
  }, [enableSound]);
  useEffect(() => {
    dispatch(getActiveconversations());
  }, []);
  // useEffect(() => {
  //   if (chatContext) {
  //     // chatContext.init();
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
  const { hidden, children, settings, saveSettings } = props;

  // ** Ref
  const isCollapsed = useRef(settings.navCollapsed);

  useEffect(() => {
    if (hidden) {
      if (settings.navCollapsed) {
        saveSettings({ ...settings, navCollapsed: false, layout: 'vertical' });
        isCollapsed.current = true;
      } else {
        // if (settings.layout === 'horizontal') {
        //   saveSettings({ ...settings, layout: 'vertical' })
        // }
      }
    } else {
      if (isCollapsed.current) {
        saveSettings({
          ...settings,
          navCollapsed: true,
          layout: settings.lastLayout,
        });
        isCollapsed.current = false;
      } else {
        if (settings.lastLayout !== settings.layout) {
          saveSettings({ ...settings, layout: settings.lastLayout });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden]);

  if (settings.layout === 'horizontal') {
    return <HorizontalLayout {...props}>{children}</HorizontalLayout>;
  }

  return <VerticalLayout {...props}>{children}</VerticalLayout>;
};

export default Layout;
