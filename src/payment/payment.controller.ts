import { Controller, Get, Post, Body, Patch, Param, Delete, Req, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { FirebaseAuthGuard } from 'src/auth/auth.guard';
import { CreatePaymentLinkDto, ValidateBankDto, WithdrawPaymentDto } from './dto/withdraw-payment.dto';
import { Request } from 'express';
import { RequireKeys } from 'src/auth/require-keys.decorator';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @RequireKeys('first_name', 'last_name', 'bvn')
  @UseGuards(FirebaseAuthGuard)
  @Get('get-banks')
  getBanks(){
    return this.paymentService.listBanks()
  }


  @RequireKeys('first_name', 'last_name', 'bvn')
  @UseGuards(FirebaseAuthGuard)
  @Post('get-payment-link')
  getPaymentLink(@Body() data : CreatePaymentLinkDto, @Req() req : Request) {
    return this.paymentService.getPaymentLink(data,req)
  }

  // "checkoutLink": "https://checkout.nomba.com/pay/159d2505-bb38-46b2-8c2c-3407d4265bcb",
  //       "orderReference": "159d2505-bb38-46b2-8c2c-3407d4265bcb"
  // @UseGuards(FirebaseAuthGuard)
  // @Get('get-checkout-trx')
  // getCheckoutTrx(@Body() data : {id:string}) {
  //   return this.paymentService.getCheckoutTrx(data.id)
  // }

  @RequireKeys('first_name', 'last_name', 'bvn')
  @UseGuards(FirebaseAuthGuard)
  @Post('validate-bank')
  validateBank(@Body() data : ValidateBankDto){
    return this.paymentService.validateBank(data)
  }

  @RequireKeys('first_name', 'last_name', 'bvn')
  @UseGuards(FirebaseAuthGuard)
  @Post('withdraw')
  withdrawFunds(@Body() dto: WithdrawPaymentDto,@Req() req : Request) {
    return this.paymentService.withdrawFunds(dto, req);
  }
}
