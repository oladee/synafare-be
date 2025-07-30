import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { User } from 'src/user/entities/user.entity';


@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}
  async sendUserOtp(email : string,otp : string) {
    await this.mailerService.sendMail({
    to: email,
    subject: 'Welcome! Synafare',
    template: 'otp',
    context : {otp}
    });
  }
}
