import { Transform } from "class-transformer"
import { IsNumber, IsOptional, IsString, Max, Min } from "class-validator"
import { Schema } from "mongoose"

export class AddLoanDto{
    @IsString()
    customer : Schema.Types.ObjectId

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