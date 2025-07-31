import { Test, TestingModule } from '@nestjs/testing';
import { IdlookupService } from './idlookup.service';

describe('IdlookupService', () => {
  let service: IdlookupService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IdlookupService],
    }).compile();

    service = module.get<IdlookupService>(IdlookupService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
