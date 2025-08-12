import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { User } from "src/user/entities/user.entity";

@Schema({ timestamps: true })
export class Account{
    @Prop({type : mongoose.Schema.Types.ObjectId, ref : "User", unique : true})
    user :  User

    @Prop({required: true})
    accountHolderId : string

    @Prop({required: true})
    accountName : string

    @Prop({required: true})
    bankAccountNumber : string

    @Prop({required: true})
    bankAccountName :  string;

    @Prop({required: true})
    bankName : string;

    @Prop({required: true})
    accountRef : string

    @Prop()
    expiryDate : Date
}

export const AccountSchema = SchemaFactory.createForClass(Account);