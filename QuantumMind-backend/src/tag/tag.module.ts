import { Global, Module } from "@nestjs/common";
import { TagService } from "./tag.service";
import { TagController } from "./tag.controller";
import { TagProviders } from "./tag.provider";

@Global()
@Module({
  controllers: [TagController],
  providers: [TagService, ...TagProviders],
  exports: [TagService],
})
export class TagModule {}
