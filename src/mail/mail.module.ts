import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailController } from './mail.controller';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [MailerModule.forRootAsync({
    useFactory : async (config : ConfigService)=>({
      transport :{
        host : 'smtp.gmail.com',
        service : 'gmail',
        secure : process.env.NODE_ENV == "dev" ? false : true,
        auth : {
          user : config.get('GMAIL_USER'),
          pass : config.get('GMAIL_AUTH')
        }
      },
      defaults : {
        from : '"No Reply" <deemajor230600@gmail.com>'
      },
      template : {
        dir : join(__dirname, 'templates'),
        adapter : new EjsAdapter(),
        options : {
          strict : true
        }
      }
    }),
    inject: [ConfigService],
  })],
  controllers: [MailController],
  providers: [MailService],
  exports : [MailService]
})
export class MailModule {}
