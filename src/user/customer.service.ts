import { BadRequestException, HttpException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Customer } from "./entities/customer.entity";
import { Model, Types } from "mongoose";
import { Request } from "express";
import { AddCustomerDto } from "./dto/add-customer.dto";



@Injectable()
export class CustomerService {
  constructor(@InjectModel(Customer.name) private customerModel: Model<Customer>) {}


    async getCustomers({filter,page,limit,req}:{filter ?:string, page : number, limit : number, req : Request}){
        const {id} = req.user
      try {
        const skip = (page - 1) * limit;
        const query: any = {};
  
        if (filter) {
          query._id = filter; 
        }
        query.user = id
  
        const [users, total] = await Promise.all([
          this.customerModel.find(query).skip(skip).limit(limit),
          this.customerModel.countDocuments(query),
        ]);
  
        return {
          data: users,
          meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
          },
        };
      } catch (error) {
        throw new HttpException(error.message || 'Failed to fetch customers', error.status || 421);
      }
    }

    async addCustomer(req : Request, data : AddCustomerDto){
        const {id} =req.user
        try {
            const cus_exist =  await this.customerModel.findOne({customer_email : data.customer_email})
            if(cus_exist){
                throw new BadRequestException("Customer already exist on the platform")
            }
            await this.customerModel.create({...AddCustomerDto, user : id})
            return{message : "Customer created successfully"}
        } catch (error) {
            throw new BadRequestException("An error occurred while adding customer details")
        }
    }

    async deleteCustomer(req : Request, cus_id : string){
        const {id} =req.user
        try {
            const cus_exist =  await this.customerModel.findOne({id : cus_id, user : id})
            if(!cus_exist){
                throw new BadRequestException("Customer not found")
            }
            await this.customerModel.findOneAndDelete({id : cus_id, user : id})
            return{message : "Customer deleted successfully"}
        } catch (error) {
            throw new BadRequestException("An error occurred while adding customer details")
        }
    }
}