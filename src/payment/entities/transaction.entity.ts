import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { User } from "src/user/entities/user.entity";


@Schema({ timestamps: true })
export class Transaction{
    @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    user: User;

    @Prop({ required: true, unique: true })
    trx_id: string;

    @Prop({ required: true, unique: true })
    ref_id: string;

    @Prop({ enum : ["fund_wallet","withdrawal","invoice_payment","loan_disbursment","loan_repayment"],required: true })
    trx_type: string;

    @Prop({ required: true })
    trx_amount: number;

    @Prop({ enum : ["successful","pending", "failed"], required: true })
    trx_status: string;

    @Prop({ required: true, default: ()=> new Date() })
    trx_date: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);