import { IsEmail, isEmail } from "class-validator";

export class CreateAdminDto{
    @IsEmail()
    email : string
}