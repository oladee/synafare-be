import { UserDocument } from "src/user/entities/user.entity"; // adjust import to match your user model
import { File as MulterFile } from 'multer';

declare module 'express' {
  export interface Request {
    user: UserDocument;
  }
}

declare namespace Express {
  export interface Request {
    file?: Multer.File;
    files?: {
      [fieldname: string]: Multer.File[];
    };
  }
}