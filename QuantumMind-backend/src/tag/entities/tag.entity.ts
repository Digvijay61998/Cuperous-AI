import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';

import * as mongoose from 'mongoose';
import { TagTypesEnum } from '../enum/tag-types.enum';
import { BotDocument } from 'src/bots/entities';
import { AgentDocument } from 'src/agent/entities/agent.entity';

export type TagDocument = Tag & mongoose.Document;

@Schema({
  timestamps: true,
})
export class Tag {
  @Prop({
    required: true,
  })
  name: string;

  @Prop({
    default: TagTypesEnum.DEFAULT,
  })
  type: TagTypesEnum;
}

export const TagSchema = SchemaFactory.createForClass(Tag);

TagSchema.pre('remove', async function (next) {
  const tag = this as any;

  const Bots = mongoose.model<BotDocument>('Bot');
  const Agents = mongoose.model<AgentDocument>('Agent');
  await Bots.updateMany(
    {
      agents: { $in: [tag._id] },
    },
    { $pull: { agents: tag._id } },
  );

  await Agents.updateMany(
    {
      tags: { $in: [tag._id] },
    },
    {
      $pull: { tags: tag._id },
    },
  );
  next();
});
