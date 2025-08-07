import { Transform } from "class-transformer";
import { IsEmail, IsNumberString, IsString } from "class-validator";

export class AddCustomerDto {

    @IsEmail()
    @Transform(({value})=> value.trim().toLowerCase())
    customer_email : string

    @IsString()
    customer_name : string

    @IsNumberString()
    customer_phn : string
}