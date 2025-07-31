import { forwardRef, Module } from '@nestjs/common';
import { IdlookupService } from './idlookup.service';
import { IdlookupController } from './idlookup.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports :[FirebaseModule,forwardRef(() => AuthModule),UserModule],
  controllers: [IdlookupController,],
  providers: [IdlookupService],
  exports : [IdlookupService]
})
export class IdlookupModule {}
