import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { OfferStatusEnum } from '../enums/offer-status.enum';
import { BotDocument } from 'src/bots/entities/bot.entity';

interface Clicks {
  botId: {
    type: mongoose.Schema.Types.ObjectId;
    ref: 'Bot';
  };

  date: Date;
  tag: string;
}

export interface Cards {
  image: string;
  link: string;
  title: string;
  description: string;
  tag: string;
}

type CardsType = Cards[];
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
export class Offer {
  @Prop()
  title: string;

  @Prop()
  cards: Cards[];

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
    enum: OfferStatusEnum,
    default: OfferStatusEnum.DRAFT,
  })
  status: OfferStatusEnum;

  // impression
}

export const OfferSchema = SchemaFactory.createForClass(Offer);

export type OfferDocument = Offer & mongoose.Document;

OfferSchema.post('save', function (doc, next) {
  const offer = doc as OfferDocument;

  if (offer.status === OfferStatusEnum.PUBLISHED) {
    offer.assignedToBots.forEach(async (botId) => {
      const bot = await mongoose.model<BotDocument>('Bot').findById(botId);
      bot.offer = offer._id;
      await bot.save();
    });
  }
  next();
});

OfferSchema.pre('findOneAndUpdate', async function (next) {
  const offer = this.getUpdate() as OfferDocument;
  const Bot = mongoose.model<BotDocument>('Bot');
  const id = this.getQuery()._id.toString();

  if (offer.assignedToBots) {
    const newBots = offer.assignedToBots;
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

  if (offer.status) {
    const bots = await this.model
      .findById(this.getQuery())
      .exec()
      .then((doc) => doc.assignedToBots.map((bot: any) => bot.toString()));

    if (offer.status === OfferStatusEnum.PUBLISHED) {
      await Bot.updateMany(
        { _id: { $in: bots } },
        { $set: { offer: id, showOffer: true } },
      );
    }

    if (offer.status === OfferStatusEnum.DRAFT) {
      await Bot.updateMany(
        { _id: { $in: bots } },
        { $unset: { offer: '' }, showOffer: false },
      );
    }
  }
  next();
});

OfferSchema.pre('remove', async function (next) {
  const offer = this as any;
  const Bot = mongoose.model<BotDocument>('Bot');

  await Bot.updateMany(
    { offer: offer._id },
    { $unset: { offer: '' }, showOffer: false },
  );

  next();
});

OfferSchema.virtual('clicksCount').get(function () {
  return this.clicks?.length;
});
