import { Test, TestingModule } from '@nestjs/testing';
import { UnansweredService } from './unanswered.service';

describe('UnansweredService', () => {
  let service: UnansweredService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UnansweredService],
    }).compile();

    service = module.get<UnansweredService>(UnansweredService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
