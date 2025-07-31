import { HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
// import * as admin from 'firebase-admin';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';
import { FirebaseService } from 'src/utils/firebase/firebase.service';
import { loginDto } from './dto/login.dto';
import { Request, Response } from 'express';
import { OtpService } from 'src/otp/otp.service';
import { accSetupDto } from './dto/acc-setup.dto';
import { IdlookupService } from 'src/utils/idlookup/idlookup.service';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService, private configService: ConfigService,private readonly firebaseService: FirebaseService,private readonly otpservice : OtpService,private readonly idlookupservice : IdlookupService) {}

  async login(loginData: loginDto, res:Response) {
    try {
      const {idToken} =loginData
      const decoded = await this.firebaseService.verifyIdToken(idToken);
      await this.firebaseService.getUser(decoded.uid);

      const expiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days

      const { uid, email, picture } = decoded;

      const user = await this.userService.findOrCreate(
        { firebaseUid: uid },
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
        this.idlookupservice.lookupDocuments({doctype : setupData.id_type, doc_number : setupData.id_number}),
        this.idlookupservice.lookupDocuments({doctype : "bvn", doc_number : setupData.bvn})
      ])

      await this.userService.findUserAndUpdate({_id : id},{...setupData})
      return {message : "Account setup successful"}
    } catch (error) {
      console.log(error)
      throw new HttpException(error.message || "An error occurred while setting up account", error.status || 400)
    }

  }

  
}
