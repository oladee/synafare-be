import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { loginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import { FirebaseAuthGuard } from './auth.guard';
import { accSetupDto } from './dto/acc-setup.dto';

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

  @UseGuards(FirebaseAuthGuard)
  @Post('setup')
  async accSetup(@Body() setupdata : accSetupDto, @Req() req: Request){
    return this.authService.accountSetup(setupdata,req)
  }

}