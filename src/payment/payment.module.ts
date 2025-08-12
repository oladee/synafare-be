import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from './entities/account.entity';
import { FirebaseModule } from 'src/utils/firebase/firebase.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [MongooseModule.forFeature([{name : Account.name,schema : AccountSchema}]),FirebaseModule,UserModule],
  controllers: [PaymentController,AccountController],
  providers: [PaymentService,AccountService],
})
export class PaymentModule {}
