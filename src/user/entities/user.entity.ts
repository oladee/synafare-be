import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({timestamps :  true})
export class User {
  @Prop({ required: true, unique: true })
  firebaseUid: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  name: string;

  @Prop({enum : ["Creator", "User"]})
  role: string;

  @Prop()
  avatar: string;
}


export const UserSchema = SchemaFactory.createForClass(User);