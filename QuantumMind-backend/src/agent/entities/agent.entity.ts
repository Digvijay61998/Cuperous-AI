import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import * as mongoose from "mongoose";
import { generateId } from "src/util";
import { AgentStatusEnum } from "../enums/agent-status.enum";
import { Tag } from "src/tag/entities/tag.entity";
import { Bot, BotDocument } from "src/bots/entities";
import { Role } from "src/common/enums/role.enum";
import { FeedbackDocument } from "src/feedback/entities/feedback.entity";
import { HttpException } from "@nestjs/common";

export type AgentDocument = Agent & mongoose.Document;

@Schema({
  timestamps: true,
  virtuals: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.__v;
      delete ret.password;
      delete ret.totalRating;
      delete ret.totalRatingCount;
      return ret;
    },
  },
})
export class Agent {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    default: true,
  })
  active: boolean;

  @Prop({
    default: AgentStatusEnum.OFFLINE,
  })
  status: AgentStatusEnum;

  @Prop()
  lastLogin: Date;

  @Prop()
  activeHours: string;

  @Prop({
    type: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
      },
    ],
    default: [],
  })
  conversations: string[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Reports" }],
    default: [],
  })
  reports: [];

  @Prop({
    default: 0,
  })
  activeConversations: number;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Bot" }],
    default: [],
  })
  assignedBots: Bot[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: Tag.name }],
    default: [],
  })
  tags: Tag[];

  @Prop()
  profilePic: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ticket" }],
  })
  serviceRequests: string[];

  @Prop()
  lastSeen: Date;

  @Prop({
    default: 10,
  })
  maxConcurrentChats: number;

  @Prop({
    default: Role.AGENT,
  })
  role: Role;

  /**
   * Tenant this user belongs to. `null` only for SUPER_ADMIN (org-independent).
   * Every non-super-admin query is scoped by this field.
   */
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    default: null,
    index: true,
  })
  organizationId: mongoose.Schema.Types.ObjectId | null;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Feedback" }],
    default: [],
  })
  feedbacks: string[];

  @Prop({
    default: 0,
  })
  totalRating: number;

  @Prop({
    default: 0,
  })
  totalRatingCount: number;

  @Prop({
    default: 0,
  })
  rating: number;

  createdAt: Date;
}

export const AgentSchema = SchemaFactory.createForClass(Agent);

AgentSchema.pre("remove", async function (next) {
  const agent = this as any;

  // The platform owner is never deletable.
  if (agent.role === Role.SUPER_ADMIN) {
    return next(new HttpException("Super admin cannot be deleted", 400));
  }

  // An organization owner cannot be removed without first transferring
  // ownership, otherwise the org would be left ownerless.
  const Organization = mongoose.model("Organization");
  const ownedOrg = await Organization.findOne({ ownerId: agent._id }).select(
    "_id"
  );
  if (ownedOrg) {
    return next(
      new HttpException(
        "Organization owner cannot be deleted; transfer ownership first",
        400
      )
    );
  }

  const Feedback = mongoose.model<FeedbackDocument>("Feedback");
  const Bot = mongoose.model<BotDocument>("Bot");
  await Bot.updateMany(
    {
      agents: { $in: [agent._id] },
    },
    { $pull: { agents: agent._id } }
  );
  await Feedback.deleteMany({ agent: agent._id });
  next();
});
