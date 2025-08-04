import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { FirebaseModule } from 'src/utils/firebase/firebase.module';
import { OtpModule } from 'src/otp/otp.module';
import { IdlookupModule } from 'src/utils/idlookup/idlookup.module';
import { FirebaseAuthGuard } from './auth.guard';
import { CloudinaryConfig } from 'src/config/cloudinary.config';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports : [ConfigModule.forRoot({
    isGlobal : true
  }),UserModule,FirebaseModule,OtpModule,forwardRef(() => IdlookupModule),JwtModule.register({
    global : true,
    secret : process.env.JWT_SECRET,
    signOptions : {expiresIn : '7d'}
  })],
  controllers: [AuthController],
  providers: [AuthService,FirebaseAuthGuard,CloudinaryConfig],
  exports: [FirebaseAuthGuard]
})
export class AuthModule {}
