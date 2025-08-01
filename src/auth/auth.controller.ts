import { Body, Controller, HttpCode, HttpStatus, Post, Get,Req, Res, UseGuards, UseInterceptors, UploadedFile, UploadedFiles } from '@nestjs/common';
import { AuthService, FileSizeValidationPipe } from './auth.service';
import { loginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import { FirebaseAuthGuard } from './auth.guard';
import { accSetupDto, businessSetup } from './dto/acc-setup.dto';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import {Express} from "express"

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

  @HttpCode(HttpStatus.OK)
  @Post('business-setup')
  @UseGuards(FirebaseAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'cac_certificate', maxCount: 1 },
        { name: 'bank_statement', maxCount: 1 },
      ],
      {
        dest: 'uploads/',
      },
  ),)
  businessSetup(@Body() businessData: businessSetup, @Req() request:Request, @UploadedFiles(new FileSizeValidationPipe()) files : {
      cac_certificate: Express.Multer.File[];
      bank_statement: Express.Multer.File[];
    }){
    const uploadFiles = {
      cac: files.cac_certificate[0],
      bank: files.bank_statement[0],
    };
    return this.authService.businessSetup(businessData,uploadFiles,request)
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('whoami')
  async whoami(@Req() req: Request){
    return this.authService.whoami(req)
  }

}
