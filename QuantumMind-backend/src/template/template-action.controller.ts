import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/auth/Public/public.decorator';
import { CreateTemplateActionDto } from './dto/create-template-action.dto';
import { SearchTemplateActionDto } from './dto/search-template-action.dto';
import { TemplateActionTypeEnum } from './enums/template-action-type.enum';
import { TemplateActionService } from './template-action.service';
import { CurrentUser } from 'src/util/current-user.decorator';
import { TenantContext } from 'src/common/tenant/tenant-context';
import { TenantScopeService } from 'src/common/tenant/tenant-scope.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ORG_STAFF } from 'src/common/enums/role.enum';

@Controller('template/actions')
@ApiTags('Template Actions')
export class TemplateActionController {
  constructor(
    private readonly templateActionService: TemplateActionService,
    private readonly tenantScope: TenantScopeService,
  ) {}

  @Post('appointment')
  @Public()
  async createAppointment(
    @Body() body: CreateTemplateActionDto & Record<string, any>,
  ) {
    return this.templateActionService.recordSubmission(
      TemplateActionTypeEnum.APPOINTMENT,
      body,
    );
  }

  @Post('form')
  @Public()
  async submitForm(
    @Body() body: CreateTemplateActionDto & Record<string, any>,
  ) {
    return this.templateActionService.recordSubmission(
      TemplateActionTypeEnum.FORM,
      body,
    );
  }

  @Post('lead')
  @Public()
  async createLead(
    @Body() body: CreateTemplateActionDto & Record<string, any>,
  ) {
    return this.templateActionService.recordSubmission(
      TemplateActionTypeEnum.LEAD,
      body,
    );
  }

  @Post('slot')
  @Public()
  async bookSlot(
    @Body() body: CreateTemplateActionDto & Record<string, any>,
  ) {
    return this.templateActionService.recordSubmission(
      TemplateActionTypeEnum.SLOT,
      body,
    );
  }

  @Post('payment')
  @Public()
  async makePayment(
    @Body() body: CreateTemplateActionDto & Record<string, any>,
  ) {
    return this.templateActionService.recordSubmission(
      TemplateActionTypeEnum.PAYMENT,
      body,
    );
  }

  @Post('quote')
  @Public()
  async generateQuote(
    @Body() body: CreateTemplateActionDto & Record<string, any>,
  ) {
    return this.templateActionService.recordSubmission(
      TemplateActionTypeEnum.QUOTE,
      body,
    );
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ description: 'Upload a file from a hosted template' })
  @Public()
  async uploadFile(
    @UploadedFile() file: any,
    @Body() body: CreateTemplateActionDto & Record<string, any>,
  ) {
    return this.templateActionService.recordUpload(body, file);
  }

  @Get('products')
  @Public()
  async fetchProducts() {
    return this.templateActionService.listProducts();
  }

  /** Captured submissions (leads, bookings, ...) — the caller's org bots only. */
  @Get('submissions')
  @ApiSecurity('bearer')
  @Roles(...ORG_STAFF)
  async findAll(
    @Query() query: SearchTemplateActionDto,
    @CurrentUser() user: TenantContext,
  ) {
    return this.templateActionService.findAll(
      query,
      await this.tenantScope.orgBotIdStrings(user),
    );
  }
}
