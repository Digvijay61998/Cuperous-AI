import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { TemplateStatusEnum } from '../enums/template-status.enum';

export type TemplateDocument = Template & mongoose.Document;

@Schema({
  virtuals: true,
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Template {
  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  slug: string;

  @Prop({
    default: '',
  })
  description: string;

  @Prop({
    required: true,
  })
  industry: string;

  @Prop({
    required: true,
  })
  category: string;

  @Prop({
    type: [String],
    default: [],
  })
  tags: string[];

  @Prop({
    default: '',
  })
  thumbnail: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    default: null,
  })
  createdBy: mongoose.Schema.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    default: null,
  })
  updatedBy: mongoose.Schema.Types.ObjectId;

  // ** Versioning **
  @Prop({
    default: '1.0.0',
  })
  currentVersion: string;

  @Prop({
    type: [
      {
        version: { type: String },
        s3Path: { type: String },
        hostedUrl: { type: String },
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent' },
        fileSize: { type: Number, default: 0 },
        fileCount: { type: Number, default: 0 },
        changelog: { type: String, default: '' },
      },
    ],
    default: [],
  })
  versions: {
    version: string;
    s3Path: string;
    hostedUrl: string;
    uploadedAt: Date;
    uploadedBy: mongoose.Schema.Types.ObjectId;
    fileSize: number;
    fileCount: number;
    changelog: string;
  }[];

  // ** Hosting **
  @Prop({
    default: '',
  })
  hostedUrl: string;

  // ** Status **
  @Prop({
    default: TemplateStatusEnum.DRAFT,
  })
  status: string;

  // ** Dynamic config schema declared by the template's manifest.json **
  @Prop({
    type: [
      {
        key: { type: String },
        // text | richtext | image | color | number | currency | select |
        // multiselect | boolean | date | time | url | list
        type: { type: String, default: 'text' },
        label: { type: String },
        defaultValue: { type: mongoose.Schema.Types.Mixed },
        group: { type: String, default: 'General' },
        options: { type: [String], default: [] }, // for select/multiselect
        helpText: { type: String, default: '' },
        required: { type: Boolean, default: false },
        min: { type: Number },
        max: { type: Number },
        maxLength: { type: Number },
        maxItems: { type: Number },
        // Row definition for `list` (repeater) fields. Stored as Mixed because
        // it holds an array of the same field shape, one level deep.
        itemSchema: { type: mongoose.Schema.Types.Mixed, default: undefined },
      },
    ],
    default: [],
  })
  configSchema: {
    key: string;
    type: string;
    label: string;
    defaultValue: any;
    group: string;
    options: string[];
    helpText?: string;
    required?: boolean;
    min?: number;
    max?: number;
    maxLength?: number;
    maxItems?: number;
    itemSchema?: Record<string, any>[];
  }[];

  // ** Catalog-level default config values. **
  // Per-customer overrides live on TemplateInstance keyed by botId; these are
  // the defaults applied when a bot has no instance of its own.
  @Prop({
    type: mongoose.Schema.Types.Mixed,
    default: {},
  })
  configValues: Record<string, any>;

  // ** Metadata **
  @Prop({
    type: [String],
    default: ['en'],
  })
  supportedLanguages: string[];

  @Prop({
    default: false,
  })
  supportsDarkMode: boolean;

  @Prop({
    default: true,
  })
  isResponsive: boolean;

  @Prop({
    default: '',
  })
  estimatedDuration: string;

  // ** Soft delete **
  @Prop({
    default: false,
  })
  isDeleted: boolean;

  @Prop({
    type: Date,
    default: null,
  })
  deletedAt: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    default: null,
  })
  deletedBy: mongoose.Schema.Types.ObjectId;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);

// ** Full text search index **
TemplateSchema.index(
  {
    name: 'text',
    description: 'text',
    slug: 'text',
    tags: 'text',
  },
  {
    weights: {
      name: 10,
      tags: 5,
      slug: 3,
      description: 1,
    },
  },
);

// ** Filter/sort indexes **
TemplateSchema.index({ industry: 1, status: 1 });
TemplateSchema.index({ category: 1, status: 1 });
TemplateSchema.index({ status: 1, createdAt: -1 });
TemplateSchema.index({ isDeleted: 1 });
