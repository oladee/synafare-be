import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { Business_Information, BusinessInformationSchema, User, UserSchema } from './entities/user.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { FirebaseModule } from 'src/utils/firebase/firebase.module';
import { Customer, CustomerSchema } from './entities/customer.entity';
import { CustomerService } from './customer.service';
import { Loan, LoanSchema } from './entities/loan.entity';
import { CustomerController } from './customer.controller';
import { LoanController } from './loan.controller';
import { LoanService } from './loan.service';
import { CloudinaryConfig } from 'src/config/cloudinary.config';

@Module({
  imports : [
    MongooseModule.forFeature([{
      name : User.name,
      schema : UserSchema
    },{name : Business_Information.name, schema : BusinessInformationSchema},{name : Customer.name, schema : CustomerSchema},{name : Loan.name, schema : LoanSchema}]),FirebaseModule
  ],
  controllers: [UserController,CustomerController,LoanController,],
  providers: [UserService,CustomerService,LoanService,CloudinaryConfig],
  exports : [UserService]
})
export class UserModule {}
