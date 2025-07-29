import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { FirebaseModule } from 'src/firebase/firebase.module';

@Module({
  imports : [UserModule,FirebaseModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
