import { Test, TestingModule } from '@nestjs/testing';
import { ChatInitializerService } from './chat-initializer.service';

describe('ChatInitializerService', () => {
  let service: ChatInitializerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatInitializerService],
    }).compile();

    service = module.get<ChatInitializerService>(ChatInitializerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
