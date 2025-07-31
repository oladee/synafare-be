import { IsEnum, IsString } from "class-validator";



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