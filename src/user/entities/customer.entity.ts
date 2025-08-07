import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User } from "./user.entity";
import mongoose from "mongoose";

@Schema({timestamps : true})
export class Customer {
    @Prop({required : true})
    customer_name :  string

    @Prop({unique : true, required : true})
    customer_email : string

    @Prop({unique : true, required : true})
    customer_phn : string
    
    @Prop({default : new Date()})
    date_joined : Date;

    @Prop({type : mongoose.Schema.Types.ObjectId, ref : "User"})
    user : User;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer)