import {IsString} from "class-validator";

export class loginDto {
    @IsString()
    idToken : string
}