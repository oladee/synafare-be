import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { AccountService } from './account.service';
import { FirebaseAuthGuard } from 'src/auth/auth.guard';
import { Request } from 'express';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @UseGuards(FirebaseAuthGuard)
  @Get('my-account')
  create(@Req() req: Request) {
    return this.accountService.myAccountDetails(req);
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('nomba-account')
  nombaAccount(@Req() req: Request) {
    return this.accountService.queryNombaAccount(req.user.id);
  }


}
