import { Body, Controller, Post } from '@nestjs/common';
import { OtpService } from './otp.service';
import { requestDto } from './dto/request-dto';
import { ValidateOtpDto } from './dto/validate-dto';

@Controller('otp')
export class OtpController {
  constructor(private readonly otpService: OtpService) {}

  @Post('request')
  async requestOtp(@Body() data : requestDto){
    return this.otpService.generateOtp(data.email)
  }

  @Post('validate')
  async validateOtp(@Body() data : ValidateOtpDto){
    return this.otpService.validateOtp(data.email,data.otp)
  }
}
