import { Test, TestingModule } from '@nestjs/testing';
import { UnansweredController } from './unanswered.controller';
import { UnansweredService } from './unanswered.service';

describe('UnansweredController', () => {
  let controller: UnansweredController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UnansweredController],
      providers: [UnansweredService],
    }).compile();

    controller = module.get<UnansweredController>(UnansweredController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
