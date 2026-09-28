import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { QuestionStatusEnum } from "../enums/question-status.enum";
import * as mongoose from "mongoose";
import { QuestionLanguage } from "../dto/create-question.dto";

@Schema({
  virtuals: true,
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.questionLanguage;
      delete ret.language;
      delete ret.search_keywords;
    },
  },
})
export class Question extends mongoose.Document {
  // Tenant owner. Null for legacy rows created before multi-tenancy; those are
  // visible only to SUPER_ADMIN until backfilled.
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    default: null,
    index: true,
  })
  organizationId: mongoose.Schema.Types.ObjectId | null;

  @Prop({
    default: "en",
  })
  language: string;

  @Prop({
    required: true,
    lowercase: true,
  })
  question: string;

  @Prop({
    required: true,
  })
  answers: string[];

  @Prop({
    default: [],
    lowercase: true,
  })
  keywords: string[];

  @Prop()
  tags: string[];

  @Prop({
    enum: QuestionStatusEnum,
    default: QuestionStatusEnum.UNDER_REVIEW,
  })
  status: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agent",
  })
  addedBy: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "Agent",
  })
  approvedBy: string;

  @Prop({
    default: 0,
  })
  usedcount: number;

  @Prop({
    default: [],
  })
  search_keywords: string[];

  @Prop({
    default: false,
  })
  private: boolean;

  @Prop()
  intent: string;

  @Prop({
    default: {
      label: "English",
      value: "en",
    },
    type: mongoose.Schema.Types.Mixed,
  })
  questionLanguage: QuestionLanguage;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

QuestionSchema.index(
  {
    search_keywords: "text",
    question: "text",
    status: 1,
  },
  {
    weights: {
      question: 10,
      search_keywords: 5,
    },
    default_language: "english",
  }
);

QuestionSchema.pre("save", function (next) {
  let keywords = [...this.keywords, ...this.question.split(" ")];

  keywords = keywords
    .map((keyword) => {
      return keyword.replace(/[^\w\s]/gi, "");
    })
    .filter((keyword) => {
      return keyword !== "";
    });
  this.search_keywords = [...new Set(keywords)];

  //this.language = this.questionLanguage['value'];
  this.language = "none";
  next();
});

QuestionSchema.virtual("lang").get(function () {
  return this.questionLanguage?.label || "";
});

export type QuestionDocument = Question & mongoose.Document;
