import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({timestamps :  true})
export class User {
  @Prop({ required: true, unique: true })
  firebaseUid: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({default : false})
  email_confirmed: boolean;

  @Prop()
  name: string;

  @Prop()
  avatar: string;

  @Prop()
  otp: string;

  @Prop()
  otpExpiry : Date
}


export const UserSchema = SchemaFactory.createForClass(User);