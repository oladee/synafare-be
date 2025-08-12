import { PartialType } from "@nestjs/mapped-types";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { Types } from "mongoose";



export enum validDoc_type {
    nin = 'nin',
    dl = "dl",
    vin = 'vin',
}

export enum valid_business_nature {
    installer = 'installer',
    distributor = 'distributor',
    supplier = 'supplier',
}

export class accSetupDto{
    @IsString()
    first_name: string;

    @IsString()
    last_name: string;

    @IsString()
    phn_no: string;

    @IsEnum(valid_business_nature, {message  :"Invalid nature of business"})
    @IsString()
    nature_of_solar_business: string;

    @IsEnum(validDoc_type, {message  :"Doctype isnt a valid type"})
    @IsString()
    id_type: string;

    @IsString()
    id_number: string;

    @IsString()
    bvn: string;
}

export class BusinessSetupDto {
    @IsString()
    business_name : string

    @IsString()
    reg_number : string

    @IsString()
    business_address : string

    @IsString()
    city : string

    @IsString()
    state : string

    @IsString()
    country : string

    @IsString()
    @IsOptional()
    user ?: string

    @IsString()
    @IsOptional()
    cac_certificate ?: string
    
    @IsString()
    @IsOptional()
    bank_statement ?: string
}

export class UpdateAccUserDto {
    @IsOptional()
    @IsString()
    first_name?: string;

    @IsOptional()
    @IsString()
    last_name?: string;

    @IsOptional()
    @IsString()
    phn_no?: string;

    @IsOptional()
    @IsString()
    avatar?: string;
}


export class UpdateBusinessDto {
    @IsOptional()
    @IsString()
    business_address ?: string

    @IsOptional()
    @IsString()
    city ?: string

    @IsOptional()
    @IsString()
    state ?: string

    @IsOptional()
    @IsString()
    country ?: string

    @IsString()
    @IsOptional()
    business_logo ?: string;
}