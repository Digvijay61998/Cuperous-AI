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

  /**
   * Agent_Intent phrases ("talk to agent", "human", …). A visitor message that
   * contains one as a whole-word sequence raises a `visitor_intent` agent
   * alert. Empty (the default) disables free-text intent alerts entirely.
   */
  @Prop({
    default: [],
  })
  agentIntents: string[];

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

  /**
   * Per-bot rollout switches for the CRM / incident-handover feature
   * (spec crm-incident-handover). Every flag defaults to OFF so existing bots
   * behave exactly as before until an admin opts in. Read through
   * `isFeatureOn` (src/common/features.ts), never directly.
   */
  @Prop({
    type: {
      crmCapture: { type: Boolean, default: false },
      incidentHandover: { type: Boolean, default: false },
      profileSummaries: { type: Boolean, default: false },
      closurePrompt: { type: Boolean, default: false },
      autoLearn: { type: Boolean, default: false },
    },
    _id: false,
    default: () => ({}),
  })
  features: Partial<Record<BotFeatureKey, boolean>>;

  // --- CRM / incident handover settings (all optional, additive) ----------

  /** Attribute aliases that hold the visitor's contact details. */
  @Prop({ type: Object, default: undefined })
  contactMapping?: { name?: string; email?: string; phone?: string };

  /** Attribute alias that holds the visitor's problem description. */
  @Prop()
  problemAlias?: string;

  /** Question asked when a handover has no problem description yet. */
  @Prop()
  problemQuestion?: string;

  /** Sent when an incident is recorded; supports `{{ticketId}}`. */
  @Prop()
  handoverMessage?: string;

  /** "Is your query resolved?" prompt text after a terminal outcome. */
  @Prop()
  closurePromptText?: string;

  /** Final message when a conversation is closed. */
  @Prop()
  closingMessage?: string;

  /** Minutes of silence after the closure prompt before auto-closing (1–60). */
  @Prop({ min: 1, max: 60 })
  closureIdleMinutes?: number;
}

export type BotFeatureKey =
  | 'crmCapture'
  | 'incidentHandover'
  | 'profileSummaries'
  | 'closurePrompt'
  | 'autoLearn';

export const BotSettingSchema = SchemaFactory.createForClass(BotSetting);
