import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { Request } from 'express';
import * as fs from "fs"
import {v2 as Cloudinary, UploadApiResponse} from 'cloudinary'
import { InjectModel } from '@nestjs/mongoose';
import { Inventory } from './entities/inventory.entity';
import { Model } from 'mongoose';

@Injectable()
export class InventoryService {
  constructor(@Inject('CLOUDINARY') private readonly cloudinary: typeof Cloudinary,@InjectModel(Inventory.name) private readonly inventoryModel :  Model<Inventory>){}

  async create(createInventoryDto: CreateInventoryDto,req : Request, files : Express.Multer.File[]) {
    const {id} = req.user
    try {
      let product_images:string[] = []
      for(const file of files){
        const item  = await this.cloudinary.uploader.upload(file.path, {
          folder: 'prod_images',
        });
        product_images.push( item.secure_url); 
      }


      const new_inventory = await this.inventoryModel.create({
        ...createInventoryDto, product_image : [...product_images], product_owner : id
      })

      return new_inventory


    } catch (error) {
      console.log(error)
      throw new BadRequestException("An error occurred while adding to your inventory")
    }
    finally{
      for(const file of files){
        fs.unlinkSync(file.path); // delete local file
      }
    }
  }

  async edit(updateInventoryDto: UpdateInventoryDto,req : Request,docId : string , files ?: Express.Multer.File[]) {
    const {id} = req.user
    try {
      const inventory_exist = await this.inventoryModel.findOne({_id : docId, product_owner : id})

      if(!inventory_exist) throw new BadRequestException("Inventory does not exist")


      let product_images:string[] = []

      if(files){
        for(const file of files){
          const item  = await this.cloudinary.uploader.upload(file.path, {
            folder: 'prod_images',
          });
          product_images.push( item.secure_url); 
        }
      }

      const inventory_update = await this.inventoryModel.findOneAndUpdate(
        { _id: docId },
        {
          ...updateInventoryDto,
          ...(product_images.length > 0 && {
            $push: { product_image: { $each: product_images } },
          }),
        },
        { new: true }
      );

      return inventory_update;


    } catch (error) {
      console.log(error)
      throw new BadRequestException("An error occurred while adding to your inventory")
    }
    finally{
      if(files){
        for(const file of files){
          fs.unlinkSync(file.path); // delete local file
        }
      }
      
    }
  }
  

  async myInventory({id,status,category,page,limit,req}:{id ?:string,status ?:string,category ?: string, page : number, limit : number, req : Request}){
    const user = req.user
    try {
      const skip = (page - 1) * limit;
      const query: any = {};

      if (id) {
        query._id = id; 
      }
      if(status){
        query.status = status
      }

      if(category){
        query.category = category
      }
      query.product_owner = user

      const [inventories,stock_value, total_products, total_in_stock, total_declined] = await Promise.all([
        this.inventoryModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
        this.inventoryModel.aggregate([
          {
            $addFields: {
              unit_price_num: { $toDouble: "$unit_price" }, // convert string to number
            },
          },
          {
            $group: {
              _id: null,
              totalValue: {
                $sum: { $multiply: ["$quantity_in_stock", "$unit_price_num"] },
              },
            },
          },
        ]),
        this.inventoryModel.countDocuments(query),
        this.inventoryModel.countDocuments({
          status: { $nin: ['unpublished', 'draft', 'out_of_stock'] },
          quantity_in_stock: { $gt: 0 },
        }),
        this.inventoryModel.countDocuments({status : "out_of_stock"}),
      ]);

      return {
        data: inventories,
        meta: {
          total_stock_value : stock_value[0]?.totalValue || 0,
          total_products,
          total_in_stock,
          total_declined,
          page,
          limit,
          totalPages: Math.ceil(total_products / limit),
        },
      };
    } catch (error) {
      console.log(error)
      throw new BadRequestException(error.message || "An error occurred while fetching your inventory")
    }
  }

  async toggleInventoryStatus (req: Request, inventId : string){
    try {
      
    } catch (error) {
      console.log(error)
      throw new BadRequestException(error.message || "An error occurred while changing inventory status")
    }
  }

  
}
