import { BadRequestException, HttpException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Customer } from "./entities/customer.entity";
import { Model, Types } from "mongoose";
import { Request } from "express";
import { AddCustomerDto } from "./dto/add-customer.dto";
import { Loan } from "./entities/loan.entity";



@Injectable()
export class LoanService {
  constructor(@InjectModel(Loan.name) private loanModel: Model<Loan>) {}


    async getLoans({id,type,page,limit,req}:{id ?:string,type ?:string, page : number, limit : number, req : Request}){
        const user = req.user
      try {
        const skip = (page - 1) * limit;
        const query: any = {};
  
        if (id) {
          query._id = id; 
        }
        if(type){
            query.loan_status = type
        }
        query.user = id
  
        const [users, total] = await Promise.all([
          this.loanModel.find(query).skip(skip).limit(limit),
          this.loanModel.countDocuments(query),
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
        throw new HttpException(error.message || 'Failed to fetch loans', error.status || 421);
      }
    }

    // async addCustomer(req : Request, data : AddCustomerDto){
    //     const {id} =req.user
    //     try {
    //         const cus_exist =  await this.customerModel.findOne({customer_email : data.customer_email})
    //         if(cus_exist){
    //             throw new BadRequestException("Customer already exist on the platform")
    //         }
    //         await this.customerModel.create({...AddCustomerDto, user : id})
    //         return{message : "Customer created successfully"}
    //     } catch (error) {
    //         throw new BadRequestException("An error occurred while adding customer details")
    //     }
    // }

    // async deleteCustomer(req : Request, cus_id : string){
    //     const {id} =req.user
    //     try {
    //         const cus_exist =  await this.customerModel.findOne({id : cus_id, user : id})
    //         if(!cus_exist){
    //             throw new BadRequestException("Customer not found")
    //         }
    //         await this.customerModel.findOneAndDelete({id : cus_id, user : id})
    //         return{message : "Customer deleted successfully"}
    //     } catch (error) {
    //         throw new BadRequestException("An error occurred while adding customer details")
    //     }
    // }
}