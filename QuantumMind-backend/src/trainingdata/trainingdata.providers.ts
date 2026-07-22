import { Connection } from "mongoose";
import { DATABASE_PROVIDER } from "src/constants";
import { TRAINING_DATA_PROVIDER } from "./constants";
import {
  TrainingData,
  TrainingDataSchema,
} from "./entities/training-data.entity";

export const TrainingDataProviders = [
  {
    provide: TRAINING_DATA_PROVIDER,
    useFactory: (connection: Connection) =>
      connection.model(TrainingData.name, TrainingDataSchema),
    inject: [DATABASE_PROVIDER],
  },
];
