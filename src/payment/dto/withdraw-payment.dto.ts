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
