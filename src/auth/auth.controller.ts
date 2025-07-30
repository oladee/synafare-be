import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { loginDto } from './dto/login.dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginData : loginDto, @Res({passthrough : true})res:Response) {
    return this.authService.login(loginData, res);
  }
  
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Res({passthrough : true}) res) {
    res.clearCookie('syna_session');
    return {message : "Logged Out"}
  }
}