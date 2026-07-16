import { Global, Module } from '@nestjs/common';
import { VisitorService } from './visitor.service';
import { VisitorController } from './visitor.controller';
import { VisitorProviders } from './visitor.provider';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  controllers: [VisitorController],
  providers: [VisitorService, ...VisitorProviders],
  exports: [VisitorService],
  imports: [HttpModule],
})
export class VisitorModule {}
