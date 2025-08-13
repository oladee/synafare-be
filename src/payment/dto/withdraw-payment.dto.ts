import { IsNumber, IsString, Min } from "class-validator"

export class WithdrawPaymentDto {
    @IsNumber()
    @Min(5000, {message : "Minimum withdrawal amount is 50 naira"})
    amount : number

    @IsString()
    bank_code : string

    @IsString()
    acc_no : string
}


export class ValidateBankDto {

    @IsString()
    bankCode : string

    @IsString()
    accountNumber : string
}

export class CreatePaymentLinkDto {
    @IsNumber()
    @Min(100, {message : "Minimum payment link amount is 100 naira"})
    amount : number;
}
