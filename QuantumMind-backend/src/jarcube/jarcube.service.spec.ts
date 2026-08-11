import { Test, TestingModule } from '@nestjs/testing';
import { JarCubeService } from './jarcube.service';

describe('JarCubeService', () => {
  let service: JarCubeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JarCubeService],
    }).compile();

    service = module.get<JarCubeService>(JarCubeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
