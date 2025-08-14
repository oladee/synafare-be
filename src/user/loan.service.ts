import { BadRequestException, HttpException, Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Request } from "express";
import { Loan } from "./entities/loan.entity";
import * as fs from "fs"
import { AddLoanDto, ValidLoanTypes } from "./dto/add-loan.dto";
import {v2 as Cloudinary, UploadApiResponse} from 'cloudinary'
import { UserService } from "./user.service";



@Injectable()
export class LoanService {
  constructor(@InjectModel(Loan.name) private loanModel: Model<Loan>,@Inject('CLOUDINARY') private readonly cloudinary: typeof Cloudinary, private readonly userService : UserService) {}


  async getLoans({id,type,page,limit,req}:{id ?:string,type ?:string, page : number, limit : number, req : Request}){
    const user = req.user
    try {
      const skip = (page - 1) * limit;
      const query: any = {};

      if (id) {
        query._id = id; 
      }
      if(type){
        query.loan_status = type
      }
      query.user = user.id

      const [loans, total] = await Promise.all([
        this.loanModel.find(query)
        .populate('customer')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
        this.loanModel.countDocuments(query),
      ]);

      return {
        data: loans,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new HttpException(error.message || 'Failed to fetch loans', error.status || 421);
    }
  }

  async loanAgreement(req : Request, action: "signed"|"not_signed"|"declined"){
    const user = req.user
    let result;
    try {
      const allowedActions = ["signed","not_signed","declined"]
      console.log(action)
      if(!allowedActions.includes(action)){
        throw new BadRequestException("Action not allowed")
      }

      if(user.loan_agreement != "signed"){
        result = await this.userService.findUserAndUpdate({_id : user.id},{loan_agreement : action})
      }
      return {message : "Agreement already signed previously", result}
    } catch (error) {
      throw new BadRequestException(error.message || "An error occurred while signing agreemenr")
    }
  }

  async addLoan(loanData: AddLoanDto, files :{ trx_invoice: Express.Multer.File; bank: Express.Multer.File }, req: Request) {
    let trx_invoiceUpload: UploadApiResponse | undefined;

    let bankUpload: UploadApiResponse | undefined;

    try {
      const { id } = req.user;
      if(loanData.loan_type === ValidLoanTypes.inventory_financing){
        delete loanData.customer
      }
      const expected = (loanData.transaction_cost * loanData.downpayment_in_percent).toFixed(2)
      const actual = loanData.downpayment_in_naira.toFixed(2)

      if(loanData.transaction_cost <= loanData.downpayment_in_naira){
        throw new BadRequestException("Transaction cost can not be lower then downpayment")
      }

      if(expected != actual) throw new BadRequestException("Downpayment does not tally with payment percentage")

      if (files?.trx_invoice) {
        trx_invoiceUpload = await this.cloudinary.uploader.upload(files.trx_invoice.path, {
          folder: 'trx_invoice',
        });
        fs.unlinkSync(files.trx_invoice.path); // delete local file
        loanData.trx_invoice = trx_invoiceUpload.secure_url; // store the URL
      }

      if (files.bank) {
        bankUpload = await this.cloudinary.uploader.upload(files.bank.path, {
          folder: 'bank_statements',
        });
        fs.unlinkSync(files.bank.path); // delete local file
        loanData.bank_statement = bankUpload.secure_url; 
      }

      const loan_amount = (loanData.transaction_cost - loanData.downpayment_in_naira).toFixed(2)

      const loan_interest = ((Number(loan_amount) * 0.06) * loanData.loan_duration_in_months).toFixed(2)

      const total_repayment = (Number(loan_amount) + Number(loan_interest)).toFixed(2)

      await this.loanModel.create({...loanData,loan_amount_requested : loan_amount,loan_amount, total_repayment, user : id});
      return {
        message: 'Loan Application Submitted Successfully',
      };

    } catch (error) {
      if (trx_invoiceUpload?.public_id) {
        await this.cloudinary.uploader.destroy(trx_invoiceUpload.public_id);
      }
      if (bankUpload?.public_id) {
        await this.cloudinary.uploader.destroy(bankUpload.public_id);
      }

      // Delete local files if still present
      if (files?.trx_invoice && fs.existsSync(files.trx_invoice.path)) {
        fs.unlinkSync(files.trx_invoice.path);
      }
      if (files?.bank && fs.existsSync(files.bank.path)) {
        fs.unlinkSync(files.bank.path);
      }

      throw new HttpException(
        error.message ||'An error occurred while setting up your account',
        error.status || 400
      );
    }
  }

  async allLoans({id,type,page,limit}:{id ?:string,type ?:string, page : number, limit : number}){
    try {
      const skip = (page - 1) * limit;
      const query: any = {};

      if (id) {
        query._id = id; 
      }
      if(type){
        query.loan_status = type
      }

      const [loans, total, total_accepted, total_declined] = await Promise.all([
        this.loanModel.find(query)
        .populate('customer')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
        this.loanModel.countDocuments(query),
        this.loanModel.countDocuments({loan_status : {$nin: ['rejected', 'pending']}}),
        this.loanModel.countDocuments({loan_status : "rejected"}),
      ]);

      return {
        data: loans,
        meta: {
          total,
          total_accepted,
          total_declined,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new HttpException(error.message || 'Failed to fetch loans', error.status || 421);
    }
  }

  async adminloanAction(loanId: string, amountOffered : number, actionType : "offer" | "rejected", decline_reason : string){

    try {
      const loanInfo = await this.loanModel.findOne({_id : loanId})
      if(!loanInfo) throw new BadRequestException("Loan Request not found")
      if(loanInfo.loan_status !== "pending") throw new BadRequestException("Action can't be performed as decision isnt reversible")
      if(actionType == "rejected"){
        const update = await this.loanModel.findOneAndUpdate({_id : loanId},{loan_status : "rejected",decline_reason},{new : true})

        return {message : "Loan rejected successfully", update}
      }else if(actionType == "offer"){
        if(amountOffered === 0){
          throw new BadRequestException("Offerred Amount can not be zero")
        }
        if(amountOffered > loanInfo.transaction_cost){
          throw new BadRequestException("Invalid request sent, Amount offerred cannot be higher than transaction cost")          
        }
        const loanObject = loanInfo.toObject()
        loanObject.loan_amount_offered =  amountOffered
        loanObject.downpayment_in_naira = loanObject.transaction_cost - amountOffered
        loanObject.downpayment_in_percent = (loanObject.downpayment_in_naira) / loanObject.transaction_cost
        loanObject.loan_status = "offer"
        loanObject.loan_amount = amountOffered
        loanObject.monthly_interest_value = Number(((Number(loanObject.loan_amount) * 0.06)).toFixed(2))
        loanObject.total_repayment = Number((Number(loanObject.loan_amount) + Number(loanObject.monthly_interest_value * loanObject.loan_duration_in_months)).toFixed(2))

        loanObject.monthly_repayment = Number((loanObject.total_repayment/loanObject.loan_duration_in_months).toFixed(2))


        const update = await this.loanModel.findOneAndUpdate({_id : loanId},{...loanObject},{new : true,runValidators : true})

        return {message : "Loan offer sent successfully",update}
      }

    } catch (error) {
      console.log(error)
      throw new BadRequestException(error.message || "An error occurred while performing action")
    }
  }
}