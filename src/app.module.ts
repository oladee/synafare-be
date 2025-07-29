import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { FirebaseModule } from './firebase/firebase.module';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal  : true
  }),MongooseModule.forRootAsync({
    imports : [ConfigModule],
    useFactory : (config:ConfigService)=>({
      uri : config.get("NODE_ENV") === "dev" ? config.get("MONGO_TEST_URL") : config.get("MONGO_PROD_URL")
    }),
    inject :[ConfigService]
  }),UserModule, FirebaseModule, AuthModule],
})
export class AppModule {}
