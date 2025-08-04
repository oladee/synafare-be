import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
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
      console.log("getting otp user details")
      const {userDetails} = await this.userService.findOne({email})
      console.log("user details", userDetails)
      if(userDetails){
        if(userDetails?.email_confirmed){
        throw new HttpException("Email Already Confirmed",402)
        }
        if(new Date(userDetails.otpExpiry) > now){
          throw new HttpException("Looks like we sent you one recently, kindly check for that and input in the fields", 400)
        }

        const otp = Math.floor(10000 + Math.random() * 90000).toString();

        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        console.log("find user and attach otpexpiry")
        await this.userService.findUserAndUpdate({email},{otpExpiry : expiresAt,otp})

        console.log("otpexpiry added")

        console.log("Sending mail")
        await this.mailService.sendUserOtp(email, otp);
        console.log(" mail sent")
        return;
      }else{
        throw new BadRequestException("User doesn't exist")
      }
    } catch (error) {
      throw new HttpException(error.message, 400)
    }
    
  }

  async validateOtp(email: string, otp: string) {
  try {
    const userDetails = await this.userService.findUsersWithOptions({
      email,
      otpExpiry: { $gte: new Date() },
    });
    console.log("user details: ",userDetails)

    if (userDetails.length === 0) {
      throw new HttpException("Otp expired, please request a new one", 400);
    }

    const user = userDetails[0];

    if (user.otp != otp) {
      throw new BadRequestException("Invalid Otp")
    }

    const result = await this.userService.findUserAndUpdate(
      { email },
      {
        email_confirmed: true,
        $unset: { otp: "", otpExpiry: "" },
      }
    );
    console.log("validate-result:",result)
    return { message: "You have been successfully verified" };
  } catch (error) {
    console.log(error);
    throw new HttpException(
      error.message || "An error occurred while verifying you",
      405
    );
  }
}

}
