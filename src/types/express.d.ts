import { UserDocument } from "src/user/entities/user.entity"; // adjust import to match your user model

declare module 'express' {
  export interface Request {
    user: UserDocument;
  }
}