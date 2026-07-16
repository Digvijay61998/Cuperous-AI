import { Test, TestingModule } from '@nestjs/testing';
import { AdvertisementController } from './advertisement.controller';
import { AdvertisementService } from './advertisement.service';

describe('AdvertisementController', () => {
  let controller: AdvertisementController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdvertisementController],
      providers: [AdvertisementService],
    }).compile();

    controller = module.get<AdvertisementController>(AdvertisementController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
