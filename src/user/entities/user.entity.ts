import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, HydratedDocument } from 'mongoose';

@Schema({timestamps :  true})
export class User {
  @Prop({ required: true, unique: true })
  firebaseUid: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({default : false})
  email_confirmed: boolean;

  @Prop()
  first_name: string;

  @Prop()
  last_name: string;

  @Prop()
  phn_no: string;

  @Prop({enum : ["installer","distributor","supplier"]})
  nature_of_solar_business: string;

  @Prop({enum : ["nin","dl","vin"]})
  id_type: string;

  @Prop()
  id_number: string;

  @Prop()
  bvn: string;

  @Prop()
  avatar: string;

  @Prop()
  otp: string;

  @Prop()
  otpExpiry : Date
}

export type UserDocument = HydratedDocument<User>;


export class Business_Information {
  @Prop()
  business_name : string

  @Prop()
  reg_number : string

  @Prop()
  cac_certificate : string

  @Prop()
  bank_statement : string

  @Prop()
  business_address : string

  @Prop()
  city : string

  @Prop()
  state : string

  @Prop()
  country : string

  @Prop({type : mongoose.Schema.Types.ObjectId, ref : User})
  user : User
}

export const BusinessInformationSchema = SchemaFactory.createForClass(Business_Information)


export const UserSchema = SchemaFactory.createForClass(User);