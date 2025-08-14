import { Transform } from "class-transformer"
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min, ValidateIf } from "class-validator"
import { Schema } from "mongoose"


export enum ValidLoanTypes{
    customer_loan = "customer_loan",
    inventory_financing = "inventory_financing"
}
export class AddLoanDto{

    @IsEnum(ValidLoanTypes)
    loan_type : ValidLoanTypes

    @ValidateIf((o)=>o.loan_type == ValidLoanTypes.customer_loan)
    @IsString()
    customer ?: string

    @Transform(({ value }) => parseFloat(value))
    @IsNumber()
    transaction_cost : number

    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(3,{ message: 'Loan Duation must be in at least 3 months' })
    @Max(6,{ message: 'Loan Duation must be in at maximum of 6 months' })
    loan_duration_in_months : number

    @Transform(({ value }) => parseFloat(value))
    @IsNumber()
    @Min(0.3,{ message: 'Downpayment must be at least 30%' })
    @Max(0.7,{ message: 'Downpayment must be at most 70%' })
    downpayment_in_percent : number

    @Transform(({ value }) => parseFloat(value))
    @IsNumber()
    downpayment_in_naira : number

    @IsString()
    @IsOptional()
    bank_statement : string

    @IsString()
    @IsOptional()
    trx_invoice : string
}

export enum validAdminLoanActionType{
    rejected = "rejected",
    offer =  "offer"
}
export class AdminLoanActionDto {
    @IsEnum(validAdminLoanActionType)
    actionType : validAdminLoanActionType

    @ValidateIf((o)=>o.actionType === validAdminLoanActionType.offer)
    @IsNumber()
    amountOffered : number

    @ValidateIf((o)=>o.actionType === validAdminLoanActionType.rejected)
    @IsString()
    decline_reason : string
}