import { Type } from "class-transformer";
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, ValidateIf } from "class-validator"

export enum validProductStatus{
    published = "published",
    unpublished = "unpublished",
    draft = "draft",
    out_of_stock = "out_of_stock"
}

export class CreateInventoryDto {

    @IsEnum(validProductStatus)
    status : validProductStatus

    @ValidateIf((o)=>o.status !== validProductStatus.draft)
    @IsString()
    product_name : string

    @ValidateIf((o)=>o.status !== validProductStatus.draft)
    @IsString()
    product_category : string

    @ValidateIf((o)=>o.status !== validProductStatus.draft)
    @Type(() => Number)
    @IsNumber()
    product_sku: number;

    @ValidateIf((o)=>o.status !== validProductStatus.draft)
    @Type(() => Number)
    @IsNumber()
    quantity_in_stock: number;

    @ValidateIf((o)=>o.status !== validProductStatus.draft)
    @IsString()
    brand : string

    @ValidateIf((o)=>o.status !== validProductStatus.draft)
    @IsString()
    model : string

    @ValidateIf((o)=>o.status !== validProductStatus.draft)
    @Type(() => Number)
    @IsNumber()
    unit_price : string

    @ValidateIf((o)=>o.status !== validProductStatus.draft)
    @IsString()
    desc : string

    @ValidateIf((o)=>o.status !== validProductStatus.draft)
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    product_image ?: string[];

}
