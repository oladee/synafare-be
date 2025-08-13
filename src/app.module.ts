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
import { APP_GUARD, Reflector } from '@nestjs/core';
import { RolesGuard } from './auth/roles.guard';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal  : true
  }),MongooseModule.forRootAsync({
    imports : [ConfigModule],
    useFactory : (config:ConfigService)=>({
      uri : config.get("MONGO_PROD_URL")
    }),
    inject :[ConfigService]
  }),UserModule, FirebaseModule, AuthModule, OtpModule, MailModule,ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'), // Path to your static assets
    }),IdlookupModule, PaymentModule, WebhookModule],

  providers : [
    Reflector,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },]
})
export class AppModule {}
