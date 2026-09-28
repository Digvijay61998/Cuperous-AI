import { Module } from "@nestjs/common";
import { FieldsModule } from "../fields/fields.module";
import { IntelligenceModule } from "../intelligence/intelligence.module";
import { ContactsController } from "./contacts.controller";
import { ContactsService } from "./contacts.service";

@Module({
  imports: [FieldsModule, IntelligenceModule],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}
