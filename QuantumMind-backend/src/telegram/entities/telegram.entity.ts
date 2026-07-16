import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TelegramStatus } from '../enums/telegram-status.enum';
import mongoose, { Document } from 'mongoose';

@Schema({
  timestamps: true,
  virtuals: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
      delete ret.token;
    },
  },
})
export class Telegram {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  telegramBotId: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bot',
    required: true,
  })
  engageBot: string;

  @Prop({
    enum: TelegramStatus,
    default: TelegramStatus.INACTIVE,
  })
  status: TelegramStatus;

  @Prop({ required: true })
  token: string;
}

export type TelegramDocument = Telegram & Document;

export const TelegramSchema = SchemaFactory.createForClass(Telegram);
