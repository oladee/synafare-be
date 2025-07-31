import { Test, TestingModule } from '@nestjs/testing';
import { IdlookupController } from './idlookup.controller';
import { IdlookupService } from './idlookup.service';

describe('IdlookupController', () => {
  let controller: IdlookupController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IdlookupController],
      providers: [IdlookupService],
    }).compile();

    controller = module.get<IdlookupController>(IdlookupController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
