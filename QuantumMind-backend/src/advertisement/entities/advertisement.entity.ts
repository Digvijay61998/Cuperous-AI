import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import mongoose, { Document } from 'mongoose';
import { AdvertisementStatus } from '../enums/advertisement-status.enum';
import { BotDocument } from 'src/bots/entities/bot.entity';

interface Clicks {
  botId: {
    type: mongoose.Schema.Types.ObjectId;
    ref: 'Bot';
  };
  date: Date;
  tag: string;
}

export interface Posters {
  image: string;
  link: string;
}

@Schema({
  timestamps: true,
  virtuals: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.__v;
      delete ret._id;
      delete ret.clicks;
    },
  },
})
export class Advertisement {
  @Prop()
  title: string;

  @Prop()
  posters: Posters[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bot' }],
    ref: 'Bot',
  })
  assignedToBots: string[];

  @Prop({
    type: [
      {
        botId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Bot',
        },
        date: {
          type: Date,
          default: Date.now,
        },
        tag: String,
      },
    ],
    default: [],
  })
  clicks: Clicks[];

  @Prop({
    default: AdvertisementStatus.DRAFT,
    enum: AdvertisementStatus,
  })
  status: AdvertisementStatus;
}

export const AdvertisementSchema = SchemaFactory.createForClass(Advertisement);

export type AdvertisementDocument = Advertisement & Document;

AdvertisementSchema.virtual('clicksCount').get(function () {
  return this.clicks?.length;
});

AdvertisementSchema.pre('remove', async function (next) {
  const advertisement = this as any;
  const Bot = mongoose.model<BotDocument>('Bot');

  await Bot.updateMany(
    { advertisement: advertisement._id },
    { $unset: { advertisement: '' } },
  );

  next();
});

AdvertisementSchema.pre('save', async function (next) {
  const advertisement = this as any;
  if (advertisement.status === AdvertisementStatus.PUBLISHED) {
    const Bot = mongoose.model<BotDocument>('Bot');
    await Bot.updateMany(
      { advertisement: advertisement._id },
      { $set: { advertisement: advertisement._id } },
    );
  }

  next();
});

AdvertisementSchema.pre('findOneAndUpdate', async function (next) {
  const advertisement = this.getUpdate() as AdvertisementDocument;
  const Bot = mongoose.model<BotDocument>('Bot');
  const id = this.getQuery()._id.toString();

  if (advertisement.assignedToBots) {
    const newBots = advertisement.assignedToBots;
    const oldBots = await this.model
      .findById(this.getQuery())
      .exec()
      .then((doc) => doc.assignedToBots.map((bot: any) => bot.toString()));

    const botTounassign = oldBots.filter(
      (bot: string) => !newBots.includes(bot),
    );

    const Bot = mongoose.model<BotDocument>('Bot');
    await Bot.updateMany(
      { _id: { $in: botTounassign } },
      { $unset: { advertisement: '' } },
    );
  }

  if (advertisement.status) {
    const bots = await this.model
      .findById(this.getQuery())
      .exec()
      .then((doc) => doc.assignedToBots.map((bot: any) => bot.toString()));

    if (advertisement.status === AdvertisementStatus.PUBLISHED) {
      await Bot.updateMany(
        { _id: { $in: bots } },
        { $set: { advertisement: id, showAdvertisement: true } },
      );
    }

    if (advertisement.status === AdvertisementStatus.DRAFT) {
      await Bot.updateMany(
        { _id: { $in: bots } },
        { $unset: { advertisement: '' }, showAdvertisement: false },
      );
    }
  }
  next();
});
