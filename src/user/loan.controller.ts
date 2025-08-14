import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { FirebaseAuthGuard } from "src/auth/auth.guard";
import { Request } from "express";
import { LoanService } from "./loan.service";
import { FileSizeValidationPipe } from "src/auth/auth.service";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { AddLoanDto, AdminLoanActionDto, SignAgreementDto, UserLoanActionDto, validUserLoanActionType } from "./dto/add-loan.dto";
import { RequireKeys } from "src/auth/require-keys.decorator";
import { Roles } from "src/auth/roles.decorator";


@UseGuards(FirebaseAuthGuard)
@RequireKeys('first_name', 'last_name', 'bvn')
@Controller('loan')
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  @Get('myloans')
  getLoans(@Req() req : Request, @Query('id') id?: string,@Query('type') type?:"active" | "completed" | "pending",
    @Query('page') page = 1,
    @Query('limit') limit = 10){
      return this.loanService.getLoans({id,type, page, limit,req})
  }

  @Post("agreement")
  loanAgreement(@Req() req : Request, @Body() data : {action : "signed" | "not_signed" | "declined"} ){
    return this.loanService.loanAgreement(req,data.action)
  }


  @HttpCode(HttpStatus.OK)
  @Post('apply')
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
  addLoan(@Body() loanData : AddLoanDto, @Req() request:Request, @UploadedFiles(new FileSizeValidationPipe()) files : {
    trx_invoice: Express.Multer.File[];
    bank_statement: Express.Multer.File[];
  }){
    if (!files?.trx_invoice?.length || !files?.bank_statement?.length) {
      throw new BadRequestException('trx_invoice and bank_statement are required.');
    }
    const uploadFiles = {
      trx_invoice: files.trx_invoice[0],
      bank: files.bank_statement[0],
    };
    return this.loanService.addLoan(loanData,uploadFiles,request)
  }

  @Patch('action/:id')
  userLoanAction(@Body() data : UserLoanActionDto,@Param('id') id : string,@Req() req : Request){
    return this.loanService.userloanAction(id, data.actionType,req)
  }

  @Get(':id/repay-history')
  repayHistory(@Param('id') id : string,@Req() req : Request){
    return this.loanService.loanRepaymentHistory(id, req)
  }

  @Patch(':id/agreement')
  signLoanAgreement(@Param('id') loanId : string, @Body() data : SignAgreementDto, @Req() req : Request){
    return this.loanService.offerAgreement(loanId,data.actionType,req)
  }

  @Patch(':id/downpayment')
  downpayment(@Param('id') loanId : string, @Req() req : Request){
    return this.loanService.payDownPayment(loanId,req)
  }

  @Patch(':id/liquidate')
  liquidate(@Param('id') loanId : string, @Req() req : Request){
    return this.loanService.liquidateLoan(loanId,req)
  }

  @Roles('admin')
  @Get('admin/all-loans')
  getAllLoans( @Query('id') id?: string,@Query('type') type?:"active" | "completed" | "pending",
    @Query('page') page = 1,
    @Query('limit') limit = 10){
    return this.loanService.allLoans({id,type, page, limit})
  }

  // @Roles('admin')
  @Patch('admin/action/:id')
  adminLoanAction(@Body() data : AdminLoanActionDto,@Param('id') id : string){
    return this.loanService.adminloanAction(id, data.amountOffered,data.actionType,data.decline_reason)
  }




}