import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

export type TokenDocument = Token & mongoose.Document;

@Schema()
export class Token {
  @Prop()
  token: string;

  @Prop()
  userId: string;

  @Prop()
  email: string;

  @Prop()
  role: string;

  @Prop({
    default: () => Date.now() + 7 * 24 * 60 * 60 * 1000,
  })
  expiresAt: Date;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
TokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
