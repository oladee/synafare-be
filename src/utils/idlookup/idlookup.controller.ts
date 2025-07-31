import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { IdlookupService } from './idlookup.service';
import { documentLookup } from './dto/lookup.dto';
import { FirebaseAuthGuard } from 'src/auth/auth.guard';

@Controller('idlookup')
export class IdlookupController {
  constructor(private readonly idlookupService: IdlookupService) {}

  @UseGuards(FirebaseAuthGuard)
  @Get('verify')
  async verifyId(@Query() doc_data : documentLookup){
    
    return this.idlookupService.lookupDocuments(doc_data)
  }
}
