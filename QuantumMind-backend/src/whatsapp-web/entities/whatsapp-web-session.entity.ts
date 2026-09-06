import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { WhatsappWebSessionStatus } from '../enums/session-status.enum';

export type WhatsappWebSessionDocument = WhatsappWebSession & mongoose.Document;

/**
 * A single WhatsApp Web (baileys) session. Mirrors OpenWA's `sessions` table,
 * adapted to Mongoose and linked to a JarCube Bot + the Social messenger row
 * that represents it in the UI. One document == one linkable WhatsApp number.
 */
@Schema({
  timestamps: true,
  virtuals: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
    },
  },
})
export class WhatsappWebSession {
  /** Unique, on-disk auth-dir key. Lowercase letters, digits and hyphens only. */
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({
    enum: Object.values(WhatsappWebSessionStatus),
    default: WhatsappWebSessionStatus.CREATED,
  })
  status: string;

  /** Linked WhatsApp phone number (E.164 digits), set once the session is ready. */
  @Prop()
  phone: string;

  /** WhatsApp profile display name of the linked account. */
  @Prop()
  pushName: string;

  /** The JarCube Bot this session's inbound messages are routed to. */
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Bot' })
  jarcubeBot: any;

  /** The Social messenger row that represents this session in the UI list. */
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Social' })
  social: any;

  /** Human-readable reason carried while status is `failed`. */
  @Prop()
  lastError: string;

  @Prop()
  connectedAt: Date;

  @Prop()
  lastActiveAt: Date;
}

export const WhatsappWebSessionSchema =
  SchemaFactory.createForClass(WhatsappWebSession);
