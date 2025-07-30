import { Transform } from "class-transformer";
import { IsEmail } from "class-validator";

export class requestDto{
    @IsEmail()
    @Transform(({value})=> value.trim())
    @Transform(({value})=> value.toLowerCase())
    email : string
}