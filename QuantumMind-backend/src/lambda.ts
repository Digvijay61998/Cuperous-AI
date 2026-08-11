import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import ServerlessExpress from "@vendia/serverless-express";
import { Callback, Context, Handler } from "aws-lambda";
import * as express from "express";
import helmet from "helmet";
import Redis from "ioredis";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./ExceptionFilter/http-exception.filter";
import { initAdapters } from "./socket/adaptor.init";

const logger = new Logger("bootstrap");

let cachedServer: Handler;
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const configService = app.get(ConfigService);

  const redisClient = new Redis(configService.get("redis"));
  app.enableCors({
    origin: true,
    credentials: true,
  });

  redisClient.on("error", (err) =>
    logger.error("Error connecting to redis", err)
  );
  redisClient.on("connect", () =>
    logger.verbose("Connected to redis successfully")
  );

  initAdapters(app);

  app.setGlobalPrefix("api", { exclude: ["/"] });
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  //app.useStaticAssets(join(__dirname, "..", "public"));
  app.setViewEngine("hbs");
  // app.useStaticAssets(join(__dirname, "..", "uploaded-docs"), {
  //   index: false,
  //   prefix: "/api/file",
  // });

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
    })
  );
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));
  const options = new DocumentBuilder()
    .setTitle("JarCube")
    .setDescription("JarCube APIs")
    .setVersion("1.0.0")
    .addBearerAuth()
    .setContact("Help", "", "help@engage.com")
    .setTitle("JarCube API")
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup("/api/docs", app, document, {
    swaggerOptions: {
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },
  });

  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return ServerlessExpress({ app: expressApp });
}

export const handler = async (
  event: any,
  context: Context,
  callback: Callback
) => {
  cachedServer = cachedServer ?? (await bootstrap());
  return cachedServer(event, context, callback);
};
