import { BadRequestException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { createHmac } from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class WebhookService {

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
    async nombaLiveWebhook(data,req: Request) {
        try {
            const sk = process.env.NOMBA_WB_PROD_SK!;
            const payload = data;
            const timestamp = req.get("nomba-timestamp");
            const signature = req.get("nomba-sig-value");

            // Construct hashing payload exactly as in Nomba docs
            const hashingPayload =
                `${payload.event_type}:${payload.requestId}:${payload.data.merchant.userId}:${payload.data.merchant.walletId}:${payload.data.transaction.transactionId}:${payload.data.transaction.type}:${payload.data.transaction.time}:${payload.data.transaction.responseCode}`;

            const message = `${hashingPayload}:${timestamp}`;

            // Create HMAC
            const digest = createHmac("sha256", sk)
                .update(message)
                .digest("hex");

            if (digest !== signature) {
                console.log('digest', digest);
                console.log('signature', signature);
                console.log('hit here')
                throw new BadRequestException('Invalid signature');
            }

            console.log("Verified webhook from Nomba:", payload);
            return
        } catch (error) {
            return
        }
    }
}
