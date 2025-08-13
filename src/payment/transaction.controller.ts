import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Req, UseGuards } from '@nestjs/common';
import { Types } from 'mongoose';
import { TransactionService } from './transaction.service';
import { Request } from 'express';
import { FirebaseAuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('transaction')
export class TrasnsactionController {
  constructor(private readonly trxService: TransactionService) {}

  @UseGuards(FirebaseAuthGuard)
  @Get('my-transactions')
  myTransactions(@Req() req: Request,@Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10) {
    const sanitizedLimit = Math.min(Math.max(+limit || 10, 1), 100); // max 100 users per page
    const sanitizedPage = Math.max(+page || 1, 1);
    return this.trxService.myTransactions({ status, page: sanitizedPage, limit: sanitizedLimit,req});
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('all-transactions')
  @Roles('admin')
  allTransactions(@Query('status') status?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10) {
    const sanitizedLimit = Math.min(Math.max(+limit || 10, 1), 100); // max 100 users per page
    const sanitizedPage = Math.max(+page || 1, 1);
    return this.trxService.allTransactions({ status, page: sanitizedPage, limit: sanitizedLimit});
  }
}


