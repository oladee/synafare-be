import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { UserDocument } from 'src/user/entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Account } from './entities/account.entity';
import { Model } from 'mongoose';
import { Request } from 'express';
import { daysUntilExpiry } from 'src/utils/daysTillExpiry';

@Injectable()
export class AccountService {
  readonly nomba_base_url: string;
  readonly client_secret: string ;
  readonly client_id: string ;
  readonly account_id : string

  constructor(@InjectModel(Account.name) private readonly accountModel : Model<Account>, private readonly configService: ConfigService) {
    this.nomba_base_url =  "https://api.nomba.com"
    this.client_id = this.configService.get<string>('NOMBA_PROD_CLIENT_ID')!;
    this.client_secret =  this.configService.get<string>('NOMBA_PROD_PRIVATE_KEY')!;

    this.account_id =  this.configService.get<string>('NOMBA_PROD_ACCOUNT_ID')!;

  }


  async create(user : UserDocument) {
    try {
      const credConfig = {
        headers: {
          'Content-Type': 'application/json',
          accountId : this.account_id,
        }
      }
      const {data} = await axios.post(`${this.nomba_base_url}/v1/auth/token/issue`,{grant_type: 'client_credentials',client_id : this.client_id, client_secret : this.client_secret}, credConfig)
      const access_token = data.data.access_token;

      const virtualConfig = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
          accountId : this.account_id,
        }
      }

      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + 5);

      const virtual_body =  {
        "accountRef": user?.id ,
        "accountName": `${user?.first_name} ${user?.last_name}`,
        "currency": "NGN",
        "expiryDate": expiry,
        "bvn": user?.bvn,
      }

      const result = await axios.post(`${this.nomba_base_url}/v1/accounts/virtual`, virtual_body, virtualConfig)


      return result.data
    } catch (error) {
      console.log(error)
      throw new BadRequestException(error.response?.data?.message || 'Failed to create virtual account');
    }
  }

  async myAccountDetails(req:Request){
    const {id} = req.user
    try{
      const details = await this.accountModel.findOne({accountRef : id})
      if(!details){
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 5);
        const new_details = await this.create(req.user);
        const acc = await this.accountModel.create({
          user: id,
          accountHolderId: new_details.data.accountHolderId,
          accountName: new_details.data.accountName,
          bankAccountNumber: new_details.data.bankAccountNumber,
          bankAccountName: new_details.data.bankAccountName,
          bankName: new_details.data.bankName,
          accountRef: new_details.data.accountRef,
          expiryDate:new Date(new_details.data.expiryDate)  
        });
        return {message : "retrieved account details successfully", data: acc};
      }
      if(details && daysUntilExpiry(details.expiryDate) < 7){
        const new_details = await this.create(req.user);
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 5);
        const acc = await this.accountModel.create({
          user: id,
          accountHolderId: new_details.data.accountHolderId,
          accountName: new_details.data.accountName,
          bankAccountNumber: new_details.data.bankAccountNumber,
          bankAccountName: new_details.data.bankAccountName,
          bankName: new_details.data.bankName,
          accountRef: new_details.data.accountRef,
          expiryDate: new Date(new_details.data.expiryDate) 
        });
        return {message : "retrieved account details successfully", data: acc};
      }

      return {message : "retrieved account details successfully", data: details};
    }catch(error){
      console.log(error)
      throw new BadRequestException(error.message || 'Failed to retrieve or create account details');
    }
  }

  async simulatePayment() {
    try {
      const credConfig = {
        headers: {
          'Content-Type': 'application/json',
          accountId : this.account_id,
        }
      }
    } catch (error) {
      
    }
  }

}
