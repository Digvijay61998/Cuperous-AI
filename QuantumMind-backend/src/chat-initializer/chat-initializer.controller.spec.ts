import { Test, TestingModule } from '@nestjs/testing';
import { ChatInitializerController } from './chat-initializer.controller';

describe('ChatInitializerController', () => {
  let controller: ChatInitializerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatInitializerController],
    }).compile();

    controller = module.get<ChatInitializerController>(
      ChatInitializerController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
