import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { FirebaseAuthGuard } from 'src/auth/auth.guard';
import { CreatePaymentLinkDto, ValidateBankDto, WithdrawPaymentDto } from './dto/withdraw-payment.dto';
import { Request } from 'express';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @UseGuards(FirebaseAuthGuard)
  @Get('get-banks')
  getBanks(){
    return this.paymentService.listBanks()
  }


  @UseGuards(FirebaseAuthGuard)
  @Get('get-payment-link')
  getPaymentLink(@Body() data : CreatePaymentLinkDto, @Req() req : Request) {
    return this.paymentService.getPaymentLink(data,req)
  }

  @UseGuards(FirebaseAuthGuard)
  @Post('validate-bank')
  validateBank(@Body() data : ValidateBankDto){
    return this.paymentService.validateBank(data)
  }

  @UseGuards(FirebaseAuthGuard)
  @Post('withdraw')
  withdrawFunds(@Body() dto: WithdrawPaymentDto,@Req() req : Request) {
    return this.paymentService.withdrawFunds(dto, req);
  }
}
