import { Transform } from "class-transformer";
import { IsEmail, IsString, Length } from "class-validator";

export class ValidateOtpDto {
  @IsEmail()
  @Transform(({value})=>value.trim().lowerCase())
  email: string;

  @IsString()
  @Length(5, 5)
  otp: string;
}