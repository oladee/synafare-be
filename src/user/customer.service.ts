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
            const cus_exist =  await this.customerModel.findOne({
              $or : [
                {customer_email : data.customer_email},
                {customer_phn : data.customer_phn}
              ]
              })
            if(cus_exist){
              throw new BadRequestException("Customer already exist on the platform")
            }
            const cus_details = await this.customerModel.create({...data, user : id})
            return{message : "Customer created successfully",cus_details}
        } catch (error) {
          console.log(error)
            throw new BadRequestException(error.message || "An error occurred while adding customer details")
        }
    }

    async deleteCustomer(req : Request, cus_id : string){
        const {id} =req.user
        try {
            const cus_exist =  await this.customerModel.findOne({_id : cus_id, user : id})
            if(!cus_exist){
                throw new BadRequestException("Customer not found")
            }
            const cus_details = await this.customerModel.findOneAndDelete({_id : cus_id, user : id})
            return{message : "Customer deleted successfully",cus_details}
        } catch (error) {
          console.log(error)
            throw new BadRequestException(error.message || "An error occurred while adding customer details")
        }
    }
}