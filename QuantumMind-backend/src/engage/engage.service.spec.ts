import { Test, TestingModule } from '@nestjs/testing';
import { EngageService } from './engage.service';

describe('EngageService', () => {
  let service: EngageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EngageService],
    }).compile();

    service = module.get<EngageService>(EngageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
