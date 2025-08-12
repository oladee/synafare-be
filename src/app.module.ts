import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { FirebaseModule } from './utils/firebase/firebase.module';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OtpModule } from './otp/otp.module';
import { MailModule } from './mail/mail.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { IdlookupModule } from './utils/idlookup/idlookup.module';
import { PaymentModule } from './payment/payment.module';
import { WebhookModule } from './webhook/webhook.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal  : true
  }),MongooseModule.forRootAsync({
    imports : [ConfigModule],
    useFactory : (config:ConfigService)=>({
      uri : config.get("NODE_ENV") === "dev" ? config.get("MONGO_TEST_URL") : config.get("MONGO_PROD_URL")
    }),
    inject :[ConfigService]
  }),UserModule, FirebaseModule, AuthModule, OtpModule, MailModule,ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'), // Path to your static assets
    }),IdlookupModule, PaymentModule, WebhookModule],
})
export class AppModule {}
