import { ValidationPipe, Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import session from "express-session";
import createRedisStore from "connect-redis";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import passport from "passport";
import * as express from "express";
import helmet from "helmet";
import { join } from "path";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./ExceptionFilter/http-exception.filter";
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from "nest-winston";
import * as winston from "winston";
import { initAdapters } from "./socket/adaptor.init";

const logger =
  process.env.NODE_ENV === "production"
    ? WinstonModule.createLogger({
        transports: [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp(),

              winston.format.colorize(),
              nestWinstonModuleUtilities.format.nestLike("Backend", {
                // options

                colors: true,
              })
            ),
          }),
          new winston.transports.File({
            filename: "logs/backend.error.log",
            level: "error",
          }),

          new winston.transports.File({
            filename: "logs/backend.combined.log",
          }),
        ],
      })
    : new Logger("Backend");

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: logger,
  });

  const configService = app.get(ConfigService);
  const port = configService.get("port");
  const RedisStore = createRedisStore(session);
  const redisClient = new Redis(configService.get("redis"));
  app.enableCors({
    origin: true,
    credentials: true,
  });

  redisClient.on("error", (err) =>
    logger.error("Could not establish a connection with redis. " + err)
  );
  redisClient.on("connect", () =>
    logger.verbose("Connected to redis successfully")
  );

  app.use(
    session({
      store: new RedisStore({ client: redisClient as any }),
      secret: configService.get("session.secret"),
      resave: false,
      saveUninitialized: true,
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(cookieParser());
  initAdapters(app);

  app.setGlobalPrefix("api", { exclude: ["/"] });
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useStaticAssets(join(__dirname, "..", "public"));
  app.setViewEngine("hbs");
  app.useStaticAssets(join(__dirname, "..", "uploaded-docs"), {
    index: false,
    prefix: "/api/file",
  });

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

  await app.listen(port);
}
bootstrap();
