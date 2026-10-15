import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';

describe('WhatsappController', () => {
  let controller: WhatsappController;
  const service = {
    getWebhook: jest.fn(),
    verifySignature: jest.fn(() => true),
    handleWebhook: jest.fn(async () => undefined),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhatsappController],
      providers: [{ provide: WhatsappService, useValue: service }],
    }).compile();
    controller = module.get<WhatsappController>(WhatsappController);
  });

  const res = () => {
    const r: any = {};
    r.status = jest.fn(() => r);
    r.send = jest.fn(() => r);
    return r;
  };

  it('acknowledges a valid webhook and processes it', async () => {
    const r = res();
    await controller.postWebhook({ object: 'whatsapp_business_account' }, { rawBody: Buffer.from('{}') }, r, 'sha256=x');
    expect(r.status).toHaveBeenCalledWith(200);
    expect(service.handleWebhook).toHaveBeenCalled();
  });

  it('rejects a webhook with a bad signature without processing it', async () => {
    service.verifySignature.mockReturnValueOnce(false);
    const r = res();
    await controller.postWebhook({}, {}, r, 'sha256=bad');
    expect(r.status).toHaveBeenCalledWith(401);
    expect(service.handleWebhook).not.toHaveBeenCalled();
  });
});
