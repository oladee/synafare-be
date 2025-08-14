import { forwardRef, Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Account, AccountSchema } from './entities/account.entity';
import { FirebaseModule } from 'src/utils/firebase/firebase.module';
import { UserModule } from 'src/user/user.module';
import { TransactionService } from './transaction.service';
import { Transaction, TransactionSchema } from './entities/transaction.entity';
import { TrasnsactionController } from './transaction.controller';

@Module({
  imports: [MongooseModule.forFeature([{name : Account.name,schema : AccountSchema},{name : Transaction.name, schema : TransactionSchema}]),FirebaseModule,forwardRef(()=>UserModule)],
  controllers: [PaymentController,AccountController,TrasnsactionController],
  providers: [PaymentService,AccountService, TransactionService],
  exports: [PaymentService, AccountService, TransactionService]
})
export class PaymentModule {}
