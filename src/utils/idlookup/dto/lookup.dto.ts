import { IsEnum, IsString } from "class-validator";

export enum validDocs {
    nin = 'nin',
    bvn = 'bvn',
    dl = 'dl',
    vin = 'vin',
    cac = "cac"
}

export class documentLookup {
    @IsString()
    @IsEnum(validDocs, {
        message: 'Document type isnt valid type',
    })
    doctype : string

    @IsString()
    doc_number :  string
}