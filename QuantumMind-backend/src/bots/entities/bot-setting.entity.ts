import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
export type BotSettingDocument = BotSetting & mongoose.Document;
import { Bot } from './bot.entity';

@Schema({
  timestamps: true,
})
export class BotSetting {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bot',
  })
  botId: Bot;

  @Prop({
    default: ['all'],
  })
  domains: string[];

  @Prop({
    default: "Hi, Hope you're doing well. How can I help you?",
  })
  welcomeMessages: string;

  @Prop({
    default: [],
  })
  blockedContent: string[];

  @Prop({
    default: [],
  })
  blockedCountries: string[];

  @Prop({
    default: true,
  })
  askForFeedback: boolean;

  @Prop({
    default: false,
  })
  isLocation: boolean;

  @Prop({
    default: true,
  })
  getVisitorInfo: boolean;

  @Prop({
    default: true,
  })
  typingIndicator: boolean;

  @Prop({
    default: true,
  })
  storeVisitorInfoInCookies: boolean;

  @Prop({
    default: 'Sorry, I did not understand that. Please try again.',
  })
  fallbackMessage: string;

  @Prop({
    default: 'Thank you for contacting us. Have a nice day.',
  })
  thankyoumsg: string;

  @Prop({
    default: [
      {
        label: 'English',
        value: 'en',
      },
    ],
  })
  languages: any[];
}

export const BotSettingSchema = SchemaFactory.createForClass(BotSetting);
