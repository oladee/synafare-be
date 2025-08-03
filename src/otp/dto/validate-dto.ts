import { Transform } from "class-transformer";
import { IsEmail, IsString, Length } from "class-validator";

export class ValidateOtpDto {
  @IsEmail()
  @Transform(({ value }) => value.trim().toLowerCase())
  email: string;

  @IsString()
  @Length(5, 5)
  otp: string;
}