import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { FirebaseModule } from './firebase/firebase.module';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OtpModule } from './otp/otp.module';
import { MailModule } from './mail/mail.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

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
    }),],
})
export class AppModule {}
