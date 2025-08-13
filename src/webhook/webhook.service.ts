import { BadRequestException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { createHmac } from 'crypto';
import * as dotenv from 'dotenv';
import { UserService } from 'src/user/user.service';
import {v4 as uuidv4} from 'uuid';
import { TransactionService } from 'src/payment/transaction.service';
dotenv.config();

@Injectable()
export class WebhookService {
    constructor(private readonly trxService : TransactionService,private readonly userService : UserService) {}
//     {
//   event_type: 'payment_success',
//   requestId: 'dde74d17-8797-47d2-8114-b14cabb35571',  
//   data: {
//     merchant: {
//       walletId: '681db897241ff1f67d26bf76',
//       walletBalance: 18685684.29,
//       userId: '225b9726-6767-42a3-bcad-2b041ddeb101'  
//     },
//     terminal: {},
//     transaction: {
//       aliasAccountNumber: '4570061478',
//       fee: 10,
//       sessionId: '000004250812181749687016677173',    
//       type: 'vact_transfer',
//       transactionId: 'API-VACT_TRA-225B9-32a38a56-e02b-4280-a3df-6b1406a4bce1',
//       aliasAccountName: 'Synafare/devdee tunes',      
//       responseCode: '',
//       originatingFrom: 'api',
//       transactionAmount: 50,
//       narration: 'MOB/UTO/Synafare/devde/test funds/32321316306',
//       time: '2025-08-12T17:17:53Z',
//       aliasAccountReference: '689094006c72e191c7907c89',
//       aliasAccountType: 'VIRTUAL'
//     },
//     customer: {
//       bankCode: '033',
//       senderName: 'MOMOH OLADEMIJI OLABISI',
//       bankName: 'United Bank for Africa',
//       accountNumber: '2139831364'
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

            // handle payment_success
            if (payload.event_type === 'payment_success') {
                // Process the payment success event
                const {data} = payload
                const acc_ref = data.transaction.aliasAccountReference;
                await this.userService.findUserAndUpdate({_id : acc_ref},{$inc : {wallet_balance : data.transaction.transactionAmount * 100}})

                await this.trxService.create({ user : acc_ref ,trx_amount : data.transaction.transactionAmount * 100, trx_type : "fund_wallet",ref_id : data.transaction.transactionId,trx_date : data.transaction.time,trx_id : `TRX_${uuid}`,trx_status : "success",})

                console.log("Payment success event received:", payload);
                // You can add your business logic here
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
            return
        }
    }
}
