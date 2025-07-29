import { HttpException, Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findAll({filter,page,limit}:{filter ?:string, page : number, limit : number}) {
    try {
      const allowedFilters = ["Creator", "User"]
      if(filter && !allowedFilters.includes(filter)){
        throw new HttpException("Bad Request",400)
      }

      const skip = (page - 1) * limit;
      const query: any = {};

      if (filter) {
        query.role = filter; // assuming "role" is the field to filter by
      }

      const [users, total] = await Promise.all([
        this.userModel.find(query).skip(skip).limit(limit),
        this.userModel.countDocuments(query),
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
      throw new HttpException(error.message || 'Failed to fetch users', error.status || 500);
    }
  }

  async findOne(id: Types.ObjectId) {
    try {
      if(!Types.ObjectId.isValid(id)){
        throw new HttpException("User not found",404)
      }
      const userDetails = await this.userModel.findById(id)
      return {userDetails}
    } catch (error) {
      throw new HttpException( error.message || "User not found", error.status || 400)
    }
  }



  async findOrCreate(condition: Partial<User>, data: Partial<User>) {
    let user = await this.userModel.findOne(condition);
    if (!user) {
      user = new this.userModel(data)
      await user.save()
    }
    return user;
  }
}