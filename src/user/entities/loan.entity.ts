import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { User } from "./user.entity";
import { Customer } from "./customer.entity";

@Schema({timestamps : true})
export class Loan{

    @Prop()
    loan_type :  string

    @Prop({type : mongoose.Schema.Types.ObjectId, ref : "Customer"})
    customer :  Customer

    @Prop()
    transaction_cost : number

    @Prop()
    paid_duration : number

    @Prop({min : 3, max : 6})
    loan_duration_in_months : number

    @Prop({min : 0.3, max : 0.7})
    downpayment_in_percent : number

    @Prop()
    downpayment_in_naira : number

    @Prop()
    loan_amount_requested : number

    @Prop()
    loan_amount : number

    @Prop()
    loan_amount_offered : number

    @Prop({default : 0.06})
    interest : number

    @Prop()
    outstanding_bal : number

    @Prop()
    total_repayment : number

    @Prop()
    bank_statement : string

    @Prop()
    trx_invoice : string

    @Prop()
    next_payment : Date

    @Prop({enum : ['active', 'completed', 'offer',"pending","rejected","approved"], default : "pending"})
    loan_status : string

    @Prop()
    decline_reason : string

    @Prop({default : "not_signed", enum : ["signed","not_signed","declined"]})
    loan_agreement : string

    @Prop({type :  mongoose.Schema.Types.ObjectId, ref : "User"})
    user : User;
}

@Schema({})
export class RepaymentHistory {
    @Prop({type : mongoose.Schema.Types.ObjectId,ref : "Loan"})
    loan : Loan

    @Prop()
    repayment_date : Date

    @Prop()
    amount : number

    @Prop({default : false})
    is_paid : boolean

}
export const LoanSchema = SchemaFactory.createForClass(Loan)