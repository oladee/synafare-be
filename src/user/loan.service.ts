import { BadRequestException, HttpException, Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model, Types } from "mongoose";
import { Request } from "express";
import { Loan, RepaymentHistory } from "./entities/loan.entity";
import * as fs from "fs"
import { AddLoanDto, ValidLoanTypes } from "./dto/add-loan.dto";
import {v2 as Cloudinary, UploadApiResponse} from 'cloudinary'
import { UserService } from "./user.service";
import { TransactionService } from "src/payment/transaction.service";
import {v4 as uuidv4} from "uuid"
import { validTrxStatus, validTrxType } from "src/payment/dto/create-transaction.dto";
import { getDateMonthsFromNow } from "src/utils/daysTillExpiry";
import {InjectConnection} from '@nestjs/mongoose';



@Injectable()
export class LoanService {
  constructor(@InjectModel(Loan.name) private loanModel: Model<Loan>,@Inject('CLOUDINARY') private readonly cloudinary: typeof Cloudinary, private readonly userService : UserService, private readonly trxservice : TransactionService,@InjectModel(RepaymentHistory.name) private repayModel : Model<RepaymentHistory>,@InjectConnection() private readonly connection: mongoose.Connection) {}


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
        .populate('user','first_name last_name email')
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

  async userloanAction(loanId: string, actionType : "cancelled" | "rejected",req : Request){
    const {id} = req.user
    try {
      const loanInfo = await this.loanModel.findOne({
        _id: new Types.ObjectId(loanId),
        loan_status: { $in: ['pending', 'offer'] },
        user : id
      });

      if (!loanInfo) {
        throw new Error("Loan not found or not in pending/offer status");
      }
      if(actionType == "cancelled"){
        if(loanInfo.loan_status !== "pending")throw new BadRequestException("Only pending request can be cancelled")
        await this.loanModel.findOneAndDelete({_id : loanId})

        return {message : "Loan cancelled successfully"}
      }else if(actionType == "rejected"){
        if(loanInfo.loan_status !== "offer") throw new BadRequestException("Only loan offers can be rejected")
        await this.loanModel.findOneAndUpdate({_id : loanId},{loan_status : "rejected"})
      }

    } catch (error) {
      console.log(error)
      throw new BadRequestException(error.message || "An error occurred while performing action")
    }
  }

  async loanRepaymentHistory(loanId : string, req :Request){
    const {id} = req.user
    try {
      const result = await this.repayModel.find({loan : loanId, user : id})
      return {message : "Fetched repayment history successfully", result}
    } catch (error) {
      console.log(error)
      throw new BadRequestException(error.message || "An error occurred while trying to fetch user repayment history")
    }
  }

  async offerAgreement(loanId : string, action : string, req : Request){
    const user = req.user
    try {
      const loan_exist = await this.loanModel.findOne({_id : loanId,user : user.id, loan_status : "offer",loan_agreement : {$nin : ["signed"]}})
      if(!loan_exist){
        throw new BadRequestException("Loan offer does not exist")
      }
      await this.loanModel.findOneAndUpdate({_id : loanId},{loan_agreement : action})

      return {message : `Loan offer has been ${action}`}
    } catch (error) {
      console.log(error)
      throw new BadRequestException(error.message || "An error occurred while signing your agreement")
    }
  }

  async payDownPayment(loanId : string, req : Request){
    const user = req.user
    const session = await this.connection.startSession();
    try {
      session.startTransaction();
      const loan_exist = await this.loanModel.findOne({_id : loanId, user : user.id, loan_agreement : "signed"},null,{session})
      console.log(loan_exist)
      if(!loan_exist){
        
        throw new BadRequestException("Loan details not found, kindly check back and ensure agreement has been signed")
      }

      if(user.wallet_balance < loan_exist.downpayment_in_naira){
        
        throw new BadRequestException("Insufficient balance, kindly top up your balance")
      }

      await this.userService.findUserAndUpdate({_id : user.id},{$inc : {wallet_balance : -loan_exist.downpayment_in_naira}}, session)

      await this.trxservice.create({trx_amount : loan_exist.downpayment_in_naira,trx_status : validTrxStatus.successful,trx_date : new Date(),trx_id : `TRX_${uuidv4()}`,ref_id : uuidv4(),user : user.id,trx_type : validTrxType.down_payment},session)

      await this.loanModel.findOneAndUpdate({_id : loanId},{loan_status : "active",outstanding_bal : loan_exist.total_repayment},{session})

      await this.userService.findUserAndUpdate({_id : user.id},{$inc : {wallet_balance : loan_exist.loan_amount}}, session)

      await this.trxservice.create({trx_amount : loan_exist.loan_amount,trx_status : validTrxStatus.successful,trx_date : new Date(),trx_id : `TRX_${uuidv4()}`,ref_id : uuidv4(),user : user.id,trx_type : validTrxType.loan_disbursment},session)

      await this.repayModel.insertMany(
        Array.from(
          { length: loan_exist.loan_duration_in_months }, 
          (_, i) => ({
            amount: loan_exist.monthly_repayment,
            is_paid: false,
            loan: loanId,
            repayment_date: getDateMonthsFromNow(i + 1),
            user: user.id
          })
        ),
        { session }
      );

      await session.commitTransaction();

      return {message : "Downpaymemnt processed successfully"}
    } catch (error) {
      console.log(error)
      await session.abortTransaction();
      console.log(error)
      throw new BadRequestException(error.message || "An error occurred while processing downpayment")
    }finally{
      session.endSession();
    }
  }

  async liquidateLoan(loanId : string, req : Request){
    const user = req.user
    try {
      const loan_exist = await this.loanModel.findOne({_id : loanId, user : user.id,loan_status : {$in : ['active','overdue']}})
      if(!loan_exist) throw new BadRequestException("Loan does not exist")

      const result = await this.getClosestUnpaidRepayment(user.id, loan_exist.id)
      console.log(result)

      if(!result)return{message : "Looks like you already paid off your loan"}

      if(result.amount  > user.wallet_balance) throw new BadRequestException("Insufficient balance, can not proceed to settle your loan")

      await this.userService.findUserAndUpdate({_id : user.id},{$inc : {wallet_balance : -result.amount}})

      const repay_doc = await this.repayModel.findOneAndUpdate({_id : result._id},{is_paid : true},{new : true})
      console.log('repay doc',repay_doc)
      const loan_update = await this.loanModel.findOneAndUpdate(
        { _id: loanId },
        [
          {
            $set: {
              paid_duration: { $add: ["$paid_duration", 1] }, // same as $inc: 1
              outstanding_bal: {
                $round: [
                  { $subtract: ["$outstanding_bal", result.amount] }, // same as $inc: -result.amount
                  2 // round to 2 decimal places
                ]
              }
            }
          }
        ],
        { new: true }
      );
      console.log('loan doc',loan_update)

      if (loan_update?.paid_duration === loan_update?.loan_duration_in_months){
        await this.loanModel.findOneAndUpdate({ _id: loanId },{loan_status : "completed"})
      }

      return {message : "Loan liquidated successfuly"}

    } catch (error) {
      console.log(error)
      throw new BadRequestException(error.message || "An error occurreed while processing liquidation")
    }
  }

  async getClosestUnpaidRepayment(userId: string, loanId?: string) {
    const today = new Date();

    const filter: any = {
      user: new Types.ObjectId(userId),
      is_paid: false,
    };

    if (loanId) {
      filter.loan = new Types.ObjectId(loanId);
    }

    const result = await this.repayModel
      .aggregate([
        { $match: filter },
        {
          $addFields: {
            dateDiff: { $abs: { $subtract: ['$repayment_date', today] } },
          },
        },
        { $sort: { dateDiff: 1 } },
        { $limit: 1 },
      ])
      .exec();

    return result.length > 0 ? result[0] : null;
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
        .populate('user','first_name last_name email')
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
