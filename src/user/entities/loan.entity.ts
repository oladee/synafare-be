import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { User } from "./user.entity";
import { Customer } from "./customer.entity";

@Schema({timestamps : true})
export class Loan{
    @Prop({type : mongoose.Schema.Types.ObjectId, ref : "Customer"})
    customer :  Customer

    @Prop()
    transaction_cost : number

    @Prop({min : 3, max : 6})
    loan_duration_in_months : number

    @Prop({min : 0.3, max : 0.7})
    downpayment_in_percent : number

    @Prop()
    downpayment_in_naira : number

    @Prop()
    bank_statement : string

    @Prop()
    trx_invoice : string

    @Prop()
    next_payment : Date

    @Prop({enum : ['active', 'completed', 'offer',"pending"], default : "pending"})
    loan_status : string

    @Prop({type :  mongoose.Schema.Types.ObjectId, ref : "User"})
    user : User;
}
export const LoanSchema = SchemaFactory.createForClass(Loan)