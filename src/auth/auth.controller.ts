import { Body, Controller, HttpCode, HttpStatus, Post, Get,Req, Res, UseGuards, UseInterceptors, UploadedFile, UploadedFiles, BadRequestException, Patch, Param } from '@nestjs/common';
import { AuthService, FileSizeValidationPipe } from './auth.service';
import { loginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import { FirebaseAuthGuard } from './auth.guard';
import { accSetupDto, BusinessSetupDto, UpdateAccUserDto, UpdateBusinessDto } from './dto/acc-setup.dto';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import {Express} from "express"
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginData : loginDto, @Res({passthrough : true})res:Response) {
    return this.authService.login(loginData, res);
  }
  
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Res({passthrough : true}) res : Response) {
    res.clearCookie('syna_session');
    return {message : "Logged Out"}
  }


  @Post('setup')
  async accSetup(@Body() setupdata : accSetupDto, @Req() req: Request){
    return this.authService.accountSetup(setupdata,req)
  }

  @Patch('setup')
   @UseInterceptors(FileInterceptor('avatar',{dest : "/uploads",fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new BadRequestException('Invalid file type.'), false);
        }
        cb(null, true);
      },}))
  async editAcc(@Body() dto : UpdateAccUserDto, @Req() req: Request,@UploadedFile(new FileSizeValidationPipe()) file: Express.Multer.File){
    return this.authService.editAccount(dto,req,file)
  }

  @HttpCode(HttpStatus.OK)
  @Post('business-setup')
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

  @Patch('edit-business/:id')
   @UseInterceptors(FileInterceptor('avatar',{dest : "/uploads",fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new BadRequestException('Invalid file type.'), false);
        }
        cb(null, true);
      },}))
  async editBusiness(@Body() dto : UpdateBusinessDto, @Req() req: Request,@UploadedFile(new FileSizeValidationPipe()) file: Express.Multer.File,@Param('id') id: string){
    if (!id) {
      throw new BadRequestException('Business ID is required.');
    }
    return this.authService.editBusiness(dto,req,file,id)
  }

  @Get('whoami')
  async whoami(@Req() req: Request){
    return this.authService.whoami(req)
  }

}
