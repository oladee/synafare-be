import { Body, Controller, HttpCode, HttpStatus, Post, Get,Req, Res, UseGuards, UseInterceptors, UploadedFile, UploadedFiles, BadRequestException } from '@nestjs/common';
import { AuthService, FileSizeValidationPipe } from './auth.service';
import { loginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import { FirebaseAuthGuard } from './auth.guard';
import { accSetupDto, BusinessSetupDto } from './dto/acc-setup.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
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
        fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new BadRequestException('Invalid file type.'), false);
        }
        cb(null, true);
      },
      },
  ),)
  businessSetup(@Body() businessData: BusinessSetupDto, @Req() request:Request, @UploadedFiles(new FileSizeValidationPipe()) files : {
      cac_certificate: Express.Multer.File[];
      bank_statement: Express.Multer.File[];
    }){
    if (!files?.cac_certificate?.length || !files?.bank_statement?.length) {
      throw new BadRequestException('cac_certificate and bank_statement are required.');
    }
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
