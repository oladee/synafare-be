import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { User } from "src/user/entities/user.entity";

@Schema({timestamps : true})
export class Inventory {
    @Prop()
    product_name : string

    @Prop()
    product_category : string

    @Prop()
    product_sku : number

    @Prop()
    quantity_in_stock : number

    @Prop()
    brand : string

    @Prop()
    model : string

    @Prop()
    unit_price : string

    @Prop({enum : ['published','unpublished','draft','out_of_stock']})
    status : string

    @Prop()
    desc : string

    @Prop([String])
    product_image : [string]

    @Prop({type : mongoose.Schema.Types.ObjectId, ref : "User"})
    product_owner : User
}

@Schema({timestamps : true})
export class Catalogue {
    @Prop()
    product_name :  string

    @Prop({enum : ['inverter','battery',"panel",'accessory']})
    category : string
}


export const InventorySchema = SchemaFactory.createForClass(Inventory)

export const CatalogueSchema = SchemaFactory.createForClass(Catalogue)