import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { ChatTypeEnum } from '../enums/chat-type.enum';
import { Conversation } from './conversation.entity';

export type ChatDocument = Chat & mongoose.Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      delete ret._id;
      delete ret.__v;
      delete ret.createdAt;
      delete ret.updatedAt;
    },
  },
})
export class Chat {
  @Prop()
  message: string;

  @Prop()
  sender: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
  })
  conversationId: Conversation;

  @Prop({
    enum: ChatTypeEnum,
    default: ChatTypeEnum.TEXT,
  })
  type: string;

  @Prop()
  time: Date;

  @Prop()
  chatId: string;

  @Prop({
    default: false,
  })
  secured: boolean;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
