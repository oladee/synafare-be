import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Transaction } from './entities/transaction.entity';
import { Model } from 'mongoose';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Request } from 'express';

@Injectable()
export class TransactionService {
  constructor(@InjectModel(Transaction.name) private readonly trxModel : Model<Transaction>) {}    
  async create(dto: CreateTransactionDto) {
    try {
        const trx  = await this.trxModel.create(dto);
        return trx;
    } catch (error) {
        console.log(error)
        throw new BadRequestException(error.message || "An error occurred while creating the transaction");
    }
  }

  async myTransactions({status, page,limit, req}:{status ?: string, page : number, limit : number, req : Request}) {
    try {
      const {id} = req.user;
      const skip = (page - 1) * limit;
      const query: any = {};

      if (status) {
        query.status = status; // assuming "status" is the field to filter by
      }

      query.user = id; // Filter by user ID

      const [transactions, total] = await Promise.all([
        this.trxModel.find(query)
        .sort({createdAt : -1})
        .skip(skip)
        .limit(limit),
        this.trxModel.countDocuments(query),
      ]);

      return {
        data: transactions,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.log(error)
      throw new BadRequestException(error.message || "An error occurred while fetching transactions");
    }
  }

  async allTransactions({status, page,limit}:{status ?: string, page : number, limit : number}) {
    try {
      const skip = (page - 1) * limit;
      const query: any = {};

      if (status) {
        query.status = status; // assuming "status" is the field to filter by
      }


      const [transactions, total] = await Promise.all([
        this.trxModel.find(query)
        .sort({createdAt : -1})
        .skip(skip)
        .limit(limit),
        this.trxModel.countDocuments(query),
      ]);

      return {
        data: transactions,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.log(error)
      throw new BadRequestException(error.message || "An error occurred while fetching transactions");
    }
  }

  async findOne(params : object){
    try {
      const trx = await this.trxModel.findOne(params)
      return trx;
    } catch (error) {
      console.log(error)
      throw new BadRequestException(error.message || "An error occurred while fetching the transaction");
      
    }
  }

  async findTrxAndUpdate(params : object, update : object){
    try {
      const trx = await this.trxModel.findOneAndUpdate(params,update,{new: true});
      return trx;
    } catch (error) {
      console.log(error)
      throw new BadRequestException(error.message || "An error occurred while fetching the transaction");
      
    }
  }


}
