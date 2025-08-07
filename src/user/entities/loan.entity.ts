import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";

@Schema({timestamps : true})
export class Loan{
    @Prop({type : mongoose.Schema.Types.ObjectId, ref : "Customer"})
    customer_id :  string

    @Prop()
    transaction_cost : string

    @Prop({min : 3, max : 6})
    loan_duration_in_months : number

    @Prop({min : 0.3, max : 0.7})
    downpayment_in_percent : number

    @Prop()
    bank_statement : string

    @Prop()
    trx_invoice : string

    @Prop()
    next_payment : Date

    @Prop({enum : ['active', 'completed', 'offer',"pending"]})
    loan_status : string
}
export const LoanSchema = SchemaFactory.createForClass(Loan)