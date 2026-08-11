import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Global, Module } from '@nestjs/common';
import { MailsService } from './mails.service';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { MailsController } from './mails.controller';

@Global()
@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get('mail.host'),
          port: config.get('mail.port'),
          secure: false,

          auth: {
            user: config.get('mail.username'),
            pass: config.get('mail.password'),
          },
        },
        defaults: {
          from: `"JarCube" <${config.get('mail.from')}>`,
        },
        template: {
          dir: join(__dirname + '/templates'),
          adapter: new HandlebarsAdapter(),
          options: { strict: true },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailsService],
  exports: [MailsService],
  controllers: [MailsController],
})
export class MailsModule {}
