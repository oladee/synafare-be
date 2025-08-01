import { ArgumentMetadata, ForbiddenException, HttpException, Inject, Injectable, PipeTransform, UnauthorizedException } from '@nestjs/common';
// import * as admin from 'firebase-admin';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from 'src/utils/firebase/firebase.service';
import { loginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import { OtpService } from 'src/otp/otp.service';
import { accSetupDto, BusinessSetupDto } from './dto/acc-setup.dto';
import { IdlookupService } from 'src/utils/idlookup/idlookup.service';
import {v2 as Cloudinary, UploadApiResponse} from 'cloudinary'
import * as fs from "fs"

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService, private configService: ConfigService,private readonly firebaseService: FirebaseService,private readonly otpservice : OtpService,private readonly idlookupservice : IdlookupService,@Inject('CLOUDINARY') private readonly cloudinary: typeof Cloudinary) {}

  async login(loginData: loginDto, res:Response) {
    try {
      const {idToken} = loginData
      const decoded = await this.firebaseService.verifyIdToken(idToken);
      await this.firebaseService.getUser(decoded.uid);

      const expiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days
      const { uid, email, picture } = decoded;

      const user = await this.userService.findOrCreate(
        { email },
        {
          firebaseUid: uid,
          email: email,
          avatar: picture,
        }
      );

      if(!user.email_confirmed){
        try {
          await this.otpservice.generateOtp(user.email)
          return {message : "Otp has been sent to your email, kindly proceed to confirm your email address", status : 204}
        } catch (error) {
          throw new HttpException(error.message || "Error occurred while generating Otp", error.status || 400)
        }
        
      }
        
      const sessionCookie = await this.firebaseService.createSessionCookie(idToken,expiresIn);

      await this.firebaseService.verifySessionCookie(sessionCookie, true);

      res.cookie('syna_session', sessionCookie, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        signed : true,
        maxAge: expiresIn,
      });


      return { message: 'Login successful', user };
    } catch (err) {
        console.log(err)
        throw new HttpException(err.message || 'Invalid ID token/Bad Request', err.status || 400)
    }
  }

  async accountSetup (setupData : accSetupDto, req:Request){
    const { id } = req.user;
    try {
      // confirm id_type and id_number
      await Promise.all([
        this.idlookupservice.lookupDocuments({doctype : setupData.id_type, doc_number : String(setupData.id_number)}),
        this.idlookupservice.lookupDocuments({doctype : "bvn", doc_number : String(setupData.bvn)})
      ])

      await this.userService.findUserAndUpdate({_id : id},{...setupData})
      return {message : "Account setup successful"}
    } catch (error) {
      console.log(error)
      throw new HttpException(error.message || "An error occurred while setting up account", error.status || 400)
    }

  }

  async businessSetup(businessData: BusinessSetupDto, files :{ cac: Express.Multer.File; bank: Express.Multer.File }, req: Request) {
    let cacUpload: UploadApiResponse | undefined;

    let bankUpload: UploadApiResponse | undefined;

    try {
      const { id } = req.user;

      await this.idlookupservice.lookupDocuments({doctype : "cac", doc_number : businessData.reg_number,company_name : businessData.business_name})

      if (files?.cac) {
        cacUpload = await this.cloudinary.uploader.upload(files.cac.path, {
          folder: 'cac_certificates',
        });
        fs.unlinkSync(files.cac.path); // delete local file
        businessData.cac_certificate = cacUpload.secure_url; // store the URL
      }

      if (files.bank) {
        bankUpload = await this.cloudinary.uploader.upload(files.bank.path, {
          folder: 'bank_statements',
        });
        fs.unlinkSync(files.bank.path); // delete local file
        businessData.bank_statement = bankUpload.secure_url; // store the URL
      }

      await this.userService.createBusiness( {...businessData,user : id});
      return {
        message: 'Business setup successful',
      };

    } catch (error) {
      if (cacUpload?.public_id) {
        await this.cloudinary.uploader.destroy(cacUpload.public_id);
      }
      if (bankUpload?.public_id) {
        await this.cloudinary.uploader.destroy(bankUpload.public_id);
      }

      // Delete local files if still present
      if (files?.cac && fs.existsSync(files.cac.path)) {
        fs.unlinkSync(files.cac.path);
      }
      if (files?.bank && fs.existsSync(files.bank.path)) {
        fs.unlinkSync(files.bank.path);
      }

      throw new HttpException(
        error.message ||'An error occurred while setting up your account',
        error.status || 400
      );
    }
  }

  async whoami(req: Request) {
  const { id } = req.user;

  try {
    const { userDetails } = await this.userService.findOne({ id });

    if (!userDetails) {
      throw new HttpException("User not found", 404);
    }

    return {
      message: "User fetched successfully",
      data: userDetails,
    };
  } catch (error) {
    console.error(error);
    throw new HttpException(error.message || "Failed to fetch user", error.status || 400);
  }
  }
  

  
}

export class FileSizeValidationPipe implements PipeTransform {
  private readonly maxSize = 10 * 1024 * 1024; // 10 MB

  transform(value: any, metadata: ArgumentMetadata) {
    if (!value) return value;

    const files = this.flattenFiles(value);

    for (const file of files) {
      if (file.size > this.maxSize) {
        throw new ForbiddenException(`${file.originalname} is too large`);
      }
    }

    return value;
  }

  private flattenFiles(value: any): Express.Multer.File[] {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === 'object') {
      const fileArrays = Object.values(value).filter(Array.isArray);
      return fileArrays.flat();
    }

    return [value];
  }
}
