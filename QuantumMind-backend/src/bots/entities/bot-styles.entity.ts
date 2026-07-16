import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import { WidgetPosition } from "../enums/widget-position.enum";

export type BotStylesDocument = BotStyles & mongoose.Document;

@Schema({
  timestamps: true,
})
export class BotStyles {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "Bot",
  })
  botId: string;

  @Prop({
    default: "#FFFFFF",
  })
  textColor: string;

  @Prop({
    default: "#3F51B5",
  })
  primaryColor: string;

  @Prop({
    default: "#f44336",
  })
  secondaryColor: string;

  @Prop()
  avatar: string;

  @Prop()
  widgetAvatar: string;

  @Prop({
    default: "#FFFFFF",
  })
  headerTextColor: string;

  @Prop({
    default: "#3F51B5",
  })
  headerBackgroundColor: string;

  @Prop({
    default: "#3F51B5",
  })
  buttonColor: string;

  @Prop({
    default: "#FFFFFF",
  })
  buttonTextColor: string;

  @Prop({
    default: WidgetPosition.LEFT,
  })
  widgetPosition: string;
}

export const BotStylesSchema = SchemaFactory.createForClass(BotStyles);
