import io, { Socket } from 'socket.io-client';
import { fromEvent, Observable } from 'rxjs';
import env from 'src/configs/environments';

export interface ChatMessage {
  conversationId: string;
  message: {
    id: string;
    type: string;
    value: string;
    senderId: string;
    buttons?: unknown;
    delay?: number;
    switchToAgent?: boolean;
    agentId?: string;
    format?: string;
  };
}

export interface onNewVisitorAdded {
  _id: string;
  visitor: {
    _id: string;
    name: string;
  };
  lastMessage?: any;
}

export class SocketServices {
  private socket: Socket = {} as Socket;

  public onChatMessage(): Observable<ChatMessage> {
    return fromEvent(this.socket, 'chat-message-bot');
  }

  public onVisitorMessage(): Observable<ChatMessage> {
    return fromEvent(this.socket, 'message');
  }

  public onNewVisitor(): Observable<onNewVisitorAdded> {
    console.log('New Visitor Arrived');
    return fromEvent(this.socket, 'new-visitor');
  }

  public onConnect() {
    // console.log('onConnect', this.socket.id);
    return fromEvent(this.socket, 'connect');
  }

  public onDisconnect() {
    // console.log('onDisconnect');
    return fromEvent(this.socket, 'disconnect');
  }

  public disconnect() {
    this.socket.disconnect();
  }

  public sendMessage(event: string, data: unknown) {
    // console.log('sendMessage', event, data);
    this.socket.emit('events', data);
  }

  public reportChat(data: unknown) {
    // console.log('report conversation', data);
    this.socket.emit('report-conversation', data);
  }

  public endChat(data: unknown) {
    // console.log('end conversation', data);
    this.socket.emit('end-conversation', data);
  }

  public publish(data: unknown) {
    // console.log('publish', data);
    this.socket.emit('publish', data);
  }

  public sendTyping() {
    this.socket.emit('typing');
  }

  public sendStopTyping() {
    this.socket.emit('stop typing');
  }

  public refreshToken() {
    this.init();
  }

  public init(
    token: string = window.localStorage.getItem('accessToken') as string,
  ) {
    const url = env.baseurl;
    // console.log('init', this.socket.active);
    console.log('init', url);
    //this.socket.disconnect();
    this.socket = io(url, {
      path: '/socket.io/jarcube',
      auth: {
        token,
      },
    });

    return this.socket;
  }
}
