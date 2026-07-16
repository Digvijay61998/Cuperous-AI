import React, { ReactNode } from 'react';
import { SocketServices } from '../services/socket.services';

type Props = {
  children: ReactNode;
};

export const ChatContext: React.Context<SocketServices> = React.createContext(
  new SocketServices(),
);

export const ChatProvider = ({ children }: Props) => {
  const socketServices = new SocketServices();
  return (
    <ChatContext.Provider value={socketServices}>
      {children}
    </ChatContext.Provider>
  );
};
