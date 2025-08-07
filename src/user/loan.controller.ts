import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { CustomerService } from "./customer.service";
import { FirebaseAuthGuard } from "src/auth/auth.guard";
import { Request } from "express";
import { AddCustomerDto } from "./dto/add-customer.dto";
import { LoanService } from "./loan.service";
import { FileSizeValidationPipe } from "src/auth/auth.service";
import { FileFieldsInterceptor } from "@nestjs/platform-express";



@Controller('loan')
export class LoanController {
    constructor(private readonly loanService: LoanService) {}

    @UseGuards(FirebaseAuthGuard)
    @Get()
    getLoans(@Req() req : Request, @Query('id') id?: string,@Query('type') type?:"active" | "completed" | "pending",
        @Query('page') page = 1,
        @Query('limit') limit = 10){
            return this.loanService.getLoans({id, page, limit,req})
    }


    @HttpCode(HttpStatus.OK)
      @Post('business-setup')
      @UseGuards(FirebaseAuthGuard)
      @UseInterceptors(
        FileFieldsInterceptor(
          [
            { name: 'trx_invoice', maxCount: 1 },
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
      businessSetup(@Body() @Req() request:Request, @UploadedFiles(new FileSizeValidationPipe()) files : {
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
        return
    }


    // @UseGuards(FirebaseAuthGuard)
    // @Patch('add')
    // addcustomer(@Req() req : Request, @Body() data : AddCustomerDto){
    //     return this.customerService.addCustomer(req,data)
    // }

    // @UseGuards(FirebaseAuthGuard)
    // @Delete('delete')
    // deletecustomer(@Req() req : Request, @Body() cus_id : string){
    //     return this.customerService.deleteCustomer(req,cus_id)
    // }


}