import { BadRequestException, Injectable } from '@nestjs/common';
import { CreatePaymentLinkDto, WithdrawPaymentDto } from './dto/withdraw-payment.dto';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import axios from 'axios';
import {v4 as uuidv4} from 'uuid'
import { TransactionService } from './transaction.service';

@Injectable()
export class PaymentService {
  readonly nomba_base_url: string;
  readonly client_secret: string ;
  readonly client_id: string ;
  readonly account_id : string

  constructor( private readonly configService: ConfigService, private readonly trxService: TransactionService) {
    this.nomba_base_url =  "https://api.nomba.com"
    this.client_id = this.configService.get<string>('NOMBA_PROD_CLIENT_ID')!;
    this.client_secret =  this.configService.get<string>('NOMBA_PROD_PRIVATE_KEY')!;

    this.account_id =  this.configService.get<string>('NOMBA_PROD_ACCOUNT_ID')!;

  }

  async withdrawFunds(dto: WithdrawPaymentDto, req : Request) {
    const user = req.user
    const uuid = uuidv4()
    try {
      if(dto.amount > user.wallet_balance){
        throw new BadRequestException("Withdrawal amount exceceds current wallet balance")
      }

      const bankInfo = await this.validateBank({bankCode : dto.bank_code, accountNumber : dto.acc_no})

      await this.parentTransfer({amount : dto.amount / 100, accountName : bankInfo.data.accountName, accountNumber : dto.acc_no, bankCode : dto.bank_code,merchantTxRef : uuid,narration : "Synafare web app withdrawal" ,senderName : "Synafare web app", meta : {userId : user.id}})

    } catch (error) {
      console.log(error)
      throw new BadRequestException(error.message || "An error occurred while trying to process your withdrawal")
    }
  }

  async listBanks (){
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

      const details = await axios.get(`${this.nomba_base_url}/v1/transfers/banks/`, virtualConfig);

      return details.data
      
    } catch (error) {
      console.log(error)
      throw new BadRequestException(error.message || "An error occurred while fetching available banks")
    }
  }

  async validateBank(bankdata : {bankCode : string, accountNumber : string}){
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

      const details = await axios.post(`${this.nomba_base_url}/v1/transfers/bank/lookup`,bankdata, virtualConfig);

      return details.data
      
    } catch (error) {
      console.log(error.response.data.description)
      throw new BadRequestException(error.response.data.description || "An error occurred while validating bank")
    }
  }


  async getPaymentLink(dto: CreatePaymentLinkDto, req: Request) {
    const {id,email} = req.user
    try {
      const credConfig = {
        headers: {
          'Content-Type': 'application/json',
          accountId : this.account_id,
        }
      }

      const {data: tokenData} = await axios.post(`${this.nomba_base_url}/v1/auth/token/issue`,{grant_type: 'client_credentials',client_id : this.client_id, client_secret : this.client_secret}, credConfig)
      const access_token = tokenData.data.access_token;

      const virtualConfig = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
          accountId : this.account_id,
        }
      }

      const req_body = {
        order : {
          orderReference : `ORD_${uuidv4()}`,
          customerId  : id,
          amount : `${dto.amount}`,
          callbackUrl : "https://synafare-fe.vercel.app/dashboard",
          customerEmail : email,
          currency  : "NGN"
        }
      }

      const response = await axios.post(`${this.nomba_base_url}/v1/checkout/order`, req_body, virtualConfig);

      return response.data
      
    } catch (error) {
      console.log(error)
      throw new BadRequestException(error.response.data || "An error occurred while creating payment link")
    }
  }


  async getCheckoutTrx(id : string) {
    try {
      const credConfig = {
        headers: {
          'Content-Type': 'application/json',
          accountId : this.account_id,
        }
      }

      const {data: tokenData} = await axios.post(`${this.nomba_base_url}/v1/auth/token/issue`,{grant_type: 'client_credentials',client_id : this.client_id, client_secret : this.client_secret}, credConfig)
      const access_token = tokenData.data.access_token;

      const virtualConfig = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
          accountId : this.account_id,
        }
      }

      console.log(id)

      const req_body = {
        orderReference : id
      }


      const response = await axios.get(`${this.nomba_base_url}/v1/checkout/order/${id}`,virtualConfig);

      return response.data
      
    } catch (error) {
      console.log(error)
      throw new BadRequestException(error.response.data || "An error occurred while creating payment link")
    }
  }

  async parentTransfer(transferData:{amount : number, accountNumber : string, accountName : string, bankCode : string, merchantTxRef : string, senderName : string, narration : string,meta : {userId : string}}) {
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

      await this.trxService.create({
        user: transferData.meta.userId,
        trx_amount: transferData.amount * 100,
        trx_type: "withdrawal",
        ref_id: transferData.merchantTxRef,
        trx_date: new Date(),
        trx_id: `TRX_${uuidv4()}`,
        trx_status: "pending",
      })

      const response = await axios.post(`${this.nomba_base_url}/v1/transfers/bank/`, transferData, virtualConfig);

      return response.data
    } catch (error) {
      console.log(error)
      throw new BadRequestException(error.response.data || "An error occurred while processing your request")
    }
  }


}
