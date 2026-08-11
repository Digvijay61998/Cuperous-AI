import { Injectable } from '@nestjs/common';
import { AdvertisementService } from 'src/advertisement/advertisement.service';
import { OfferService } from 'src/offer/offer.service';
import { SocketStateService } from 'src/socket/socket-state.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConversationService } from 'src/conversation/conversation.service';
import { MessageHandlerService } from 'src/message-handler/message-handler.service';
import { AuthenticatedSocket } from 'src/socket/socket.adaptor';

@Injectable()
export class JarCubeService {
  constructor(
    private readonly offerService: OfferService,
    private readonly advertisementService: AdvertisementService,
    private readonly socketStateService: SocketStateService,
    private readonly eventEmmitter: EventEmitter2,
    private readonly conversationService: ConversationService,
    private readonly messageHandlerService: MessageHandlerService,
  ) {}

  async handleEndConversationByAgent(
    conversationId: string,
    visitorId: string,
  ) {
    this.eventEmmitter.emit('end-conversation-by-agent', {
      conversationId,
      userId: visitorId,
    });
  }

  async ReportConversation(conversationId: string, visitorId: string) {
    this.eventEmmitter.emit('report-conversation', {
      conversationId,
      userId: visitorId,
    });
    // send warning message to visitor and end conversation
  }

  async PublishOfferOrAdvertisement(visitorId: string, data: any) {
    if (data) {
      console.log(data);
      this.eventEmmitter.emit('publish-events', {
        userId: visitorId,
        data,
        event: `publish-${data.type}`,
      });
      // emit event to vistor based on type
    }
  }

  async sendTranscriptToVisitor(data: any) {
    const { visitorId, email, name } = data;
    console.log({ visitorId, email, name });
    const userData = this.socketStateService.getUserData(visitorId);
    if (userData) {
      const { conversationId } = userData;
      console.log({ conversationId });
      if (conversationId) {
        this.eventEmmitter.emit('send-transcript-to-visitor', {
          conversationId,
          email,
          visitorId,
          name,
        });
      }
    }
  }
}
