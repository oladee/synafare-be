import { Prop, Schema } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { User } from "src/user/entities/user.entity";


@Schema({ timestamps: true })
export class Transaction{
    @Prop({ required: true, type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    user: User;

    @Prop({ required: true })
    trx_id: string;

    @Prop({ required: true })
    trx_type: string;

    @Prop({ required: true })
    trx_amount: number;

    @Prop({ required: true })
    trx_status: string;

    @Prop({ required: true, default: ()=> new Date() })
    trx_date: Date;
}