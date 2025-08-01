import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MailService } from 'src/mail/mail.service';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';

@Injectable()
export class OtpService {

  constructor(readonly mailService : MailService, readonly userService : UserService){}

  async generateOtp(email: string): Promise<void> {
    try {
      const now = new Date()
      const {userDetails} = await this.userService.findOne({email})
      if(userDetails){
        if(userDetails?.email_confirmed){
        throw new HttpException("Email Already Confirmed",402)
        }
        if(new Date(userDetails.otpExpiry) > now){
          throw new HttpException("Looks like we sent you one recently, kindly check for that and input in the fields", 400)
        }
      }
      const otp = Math.floor(10000 + Math.random() * 90000).toString();

      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await this.userService.findUserAndUpdate({email},{otpExpiry : expiresAt,otp})

      await this.mailService.sendUserOtp(email, otp);
    } catch (error) {
      throw new HttpException(error.message, 400)
    }
    
  }

  async validateOtp(email: string, otp: string){
    try {
      const userDetails = await this.userService.findUsersWithOptions({email,otpExpiry : {$gte : new Date()}})
      if(userDetails && userDetails[0]?.otp == otp){
        const result = await this.userService.findUserAndUpdate({email},{email_confirmed : true, $unset : {otp : '',otpExpiry : ''}})

        console.log(result)
        
        return {message : " You have been Successfully verified"}
      }
      if(userDetails && userDetails[0]?.otp != otp){
        return {message : "Invalid otp"}
      }
      if(!userDetails){
        throw new HttpException("Otp expired, please request a new one", 400)
      }
    } catch (error) {
      console.log(error)
      throw new HttpException(error.message || "An error occured while verifying you", 405)
    }
  }
}
