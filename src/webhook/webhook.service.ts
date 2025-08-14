import { BadRequestException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { createHmac } from 'crypto';
import * as dotenv from 'dotenv';
import { UserService } from 'src/user/user.service';
import {v4 as uuidv4} from 'uuid';
import { TransactionService } from 'src/payment/transaction.service';
import { validTrxStatus, validTrxType } from 'src/payment/dto/create-transaction.dto';
dotenv.config();

@Injectable()
export class WebhookService {
    constructor(private readonly trxService : TransactionService,private readonly userService : UserService) {}
// {
//   event_type: 'payment_success',
//   requestId: '6201ad63-eeb2-4287-abd5-406584f38163',
//   data: {
//     merchant: {
//       walletId: '681db897241ff1f67d26bf76',
//       walletBalance: 19000820.89,
//       userId: '225b9726-6767-42a3-bcad-2b041ddeb101'
//     },
//     terminal: {},
//     tokenizedCardData: {
//       tokenKey: 'N/A',
//       cardType: 'N/A',
//       tokenExpiryYear: 'N/A',
//       tokenExpiryMonth: 'N/A',
//       cardPan: 'N/A'
//     },
//     transaction: {
//       fee: 1.4,
//       type: 'online_checkout',
//       transactionId: 'WEB-ONLINE_C-225B9-bfeecaba-9309-40ed-af6b-57196c712029',
//       responseCode: '',
//       originatingFrom: 'web',
//       merchantTxRef: '32329389916',
//       transactionAmount: 100,
//       time: '2025-08-13T09:00:11Z'
//     },
//     customer: { billerId: '2139831364', productId: '033' },
//     order: {
//       amount: 100,
//       orderId: '04ce7dba-c6ba-46d7-b4e7-c153cbcdb395',
//       cardType: 'N/A',
//       accountId: '225b9726-6767-42a3-bcad-2b041ddeb101',
//       cardLast4Digits: 'N/A',
//       cardCurrency: 'N/A',
//       customerEmail: 'deemajor230600@gmail.com',
//       customerId: '2139831364',
//       isTokenizedCardPayment: 'false',
//       orderReference: 'ORD_9083817f-2aed-4206-96b2-abfbb5e76f86',
//       paymentMethod: 'bank_transfer',
//       callbackUrl: 'https://synafare-fe.vercel.app/dashboard',
//       currency: 'NGN'
//     }
//   }
// }

// payout success
// Verified webhook from Nomba: {
//   event_type: 'payout_success',
//   requestId: '6532889f-0953-4115-a484-d3a174aca7aa',
//   data: {
//     merchant: {
//       walletId: '681db897241ff1f67d26bf76',
//       walletBalance: 19000922.29,
//       userId: '225b9726-6767-42a3-bcad-2b041ddeb101'
//     },
//     terminal: {},
//     transaction: {
//       fee: 50,
//       type: 'transfer',
//       transactionId: 'API-TRANSFER-76521-b851b6dc-448b-40fc-b6ac-fca5f374bbba',
//       responseCode: '',
//       originatingFrom: 'api',
//       merchantTxRef: 'e1774959-761f-4a35-8f95-c6a0cb90ab6c',
//       transactionAmount: 50,
//       narration: 'Synafare web ',
//       time: '2025-08-12T23:25:59Z'
//     },
//     customer: {
//       bankCode: '033',
//       senderName: 'Synafare web app',
//       recipientName: 'MOMOH OLADEMIJI OLABISI',
//       bankName: 'United Bank for Africa',
//       accountNumber: '2139831364'
//     }
//   }
// }
    async nombaLiveWebhook(data,req: Request) {
        try {
            const sk = process.env.NOMBA_WB_PROD_SK!;
            const payload = data;
            const timestamp = req.get("nomba-timestamp");
            const signature = req.get("nomba-sig-value");
            const uuid = uuidv4();

            console.log(payload)

            // Construct hashing payload exactly as in Nomba docs
            const hashingPayload =
                `${payload.event_type}:${payload.requestId}:${payload.data.merchant.userId}:${payload.data.merchant.walletId}:${payload.data.transaction.transactionId}:${payload.data.transaction.type}:${payload.data.transaction.time}:${payload.data.transaction.responseCode}`;

            const message = `${hashingPayload}:${timestamp}`;

            // Create HMAC
            const digest = createHmac("sha256", sk)
                .update(message)
                .digest("base64");

            if (digest !== signature) {
                console.log('digest', digest);
                console.log('signature', signature);
                throw new BadRequestException('Invalid signature');
            }

            console.log(payload)

            // handle payment_success
            if (payload.event_type === 'payment_success') {
                if(payload.data.transaction.type == "vact_transfer"){
                    // Process the payment success event
                    const {data} = payload
                    const acc_ref = data.transaction.aliasAccountReference;
                    await this.userService.findUserAndUpdate({_id : acc_ref},{$inc : {wallet_balance : data.transaction.transactionAmount}})

                    await this.trxService.create({ user : acc_ref ,trx_amount : data.transaction.transactionAmount , trx_type : validTrxType.fund_wallet,ref_id : data.transaction.transactionId,trx_date : data.transaction.time,trx_id : `TRX_${uuid}`,trx_status : validTrxStatus.successful,})

                    console.log("Payment success event received:", payload);
                    // You can add your business logic here
                }else if(payload.data.transaction.type == "online_checkout"){
                    const {data} = payload
                    const {order} = data

                    const updatedDetails = await this.userService.findUserAndUpdate({email : order.customerEmail},{$inc : {wallet_balance : order.amount}})

                    if(updatedDetails){
                        await this.trxService.create({ user : updatedDetails.id ,trx_amount : order.amount, trx_type : validTrxType.fund_wallet,ref_id : data.transaction.transactionId,trx_date : data.transaction.time,trx_id : `TRX_${uuid}`,trx_status : validTrxStatus.successful,})
                    }
                   
                }
            }

            // handle payout_success
            if (payload.event_type === 'payout_success') {
                // Process the payment success event
                const {data} = payload
                const merchantTxRef = data.transaction.merchantTxRef;
                
                const trx_detail = await this.trxService.findTrxAndUpdate({ref_id: merchantTxRef},{trx_status: "successful", trx_date: data.transaction.time});

                if(trx_detail){
                    // find user and update wallet balance
                    await this.userService.findUserAndUpdate({_id : trx_detail.user},{$inc : {wallet_balance : -data.transaction.transactionAmount * 100}})

                }
                
            }
            return
        } catch (error) {
            console.log(error)
            return
        }
    }
}
