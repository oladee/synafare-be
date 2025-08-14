import { IsDate, IsEnum, IsNumber, IsOptional, IsString } from "class-validator";


export enum validTrxStatus {
    successful = 'successful',
    pending = 'pending',
    failed = 'failed',
}

export enum validTrxType {
    fund_wallet = 'fund_wallet',
    withdrawal = 'withdrawal',
    invoice_payment = 'invoice_payment',
    down_payment = 'down_payment',
    loan_disbursment = 'loan_disbursment',
    loan_repayment = 'loan_repayment',
}

export class CreateTransactionDto {

    @IsString()
    user : string;

    @IsString()
    trx_id: string;

    @IsOptional()
    @IsString()
    ref_id?: string;

    @IsEnum(validTrxType)
    trx_type: validTrxType;

    @IsNumber() 
    trx_amount: number;

    @IsEnum(validTrxStatus)
    trx_status: validTrxStatus;

    @IsDate()
    trx_date: Date;
}