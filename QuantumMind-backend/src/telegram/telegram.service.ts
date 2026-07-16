import { Inject, Injectable, Logger, HttpException } from '@nestjs/common';
import { Model } from 'mongoose';
import { TELEGRAM_PROVIDER } from './constants';
import { TelegramDocument } from './entities/telegram.entity';
import { CreateTelegramBotDto } from './dto/create-telegram-bot.dto';
@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  constructor(
    @Inject(TELEGRAM_PROVIDER)
    private readonly telegramModel: Model<TelegramDocument>,
  ) {}

  async create(createTelegramBotDto: CreateTelegramBotDto) {
    try {
      let bot = await this.telegramModel.findOne({
        telegramBotId: createTelegramBotDto.telegramBotId,
      });
      if (bot) {
        throw new HttpException('Bot already exists', 400);
      }
      bot = new this.telegramModel(createTelegramBotDto);
      return await bot.save();
    } catch (error) {
      this.logger.error(`Error while creating telegram bot: ${error.message}`);
      throw new HttpException(
        error.message || 'Some thing went wrong',
        error.status || 500,
      );
    }
  }
}
