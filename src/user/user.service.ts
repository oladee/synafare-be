import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { Business_Information, User } from './entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { FirebaseService } from 'src/utils/firebase/firebase.service';
import { BusinessSetupDto } from 'src/auth/dto/acc-setup.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>, private readonly firebaseService : FirebaseService,@InjectModel(Business_Information.name) private businessModel: Model<Business_Information>) {}

  async findAll({filter,page,limit}:{filter ?:string, page : number, limit : number}) {
    try {

      const skip = (page - 1) * limit;
      const query: any = {};

      if (filter) {
        query._id = filter; // assuming "role" is the field to filter by
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

  async findOne({id,email} : {id ?: Types.ObjectId, email ?: string}) {
    try {
      if(id && !Types.ObjectId.isValid(id)){
        throw new HttpException("User not found",404)
      }
      const userDetails = await this.userModel.findOne({$or : [
        {_id : id},
        {email}
      ]})
      return {userDetails}
    } catch (error) {
      throw new HttpException( error.message || "User not found", error.status || 400)
    }
  }

  async findUsersWithOptions(params : object){
    try {
      const userDetails = await this.userModel.find(params)
      return userDetails
    } catch (error) {
      console.log(error)
      throw new HttpException('AN error occurred while fetching data',400)
    }
    
  }

  async findUserAndUpdate(searchParam : object, update : object, session ?: ClientSession){
    const options: any = { new: true };
    if (session) {
      options.session = session;
    }
    try {
      const userDetails = await this.userModel.findOneAndUpdate(searchParam,update,{new : true, options})
      return userDetails
    } catch (error) {
      console.log(error)
      throw new HttpException('AN error occurred while fetching data',400)
    }
  }

  async findOrCreate(condition: Partial<User>, data: Partial<User>) {
    let user = await this.userModel.findOne(condition);
    if (!user) {
      user = new this.userModel({...data, account_status : "pending",   loan_agreement : "not_signed",business_document : "not_submitted"})
      await user.save()
    }
    return user;
  }

  async deleteUser(uid: string) {
    try {
      await Promise.all([
        this.firebaseService.auth.deleteUser(uid),
        this.userModel.findOneAndDelete({firebaseUid : uid})
      ])
      return {message : `Successfully deleted user: ${uid}`}
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('User deletion failed');
    }
  }

  async createBusiness(businessData : BusinessSetupDto){
    try {
      const businessExist = await this.businessModel.findOne({user : businessData.user})
      if(businessExist){
        throw new BadRequestException("Duplicate Business Submission not allowed")
      }
      const newData = await this.businessModel.create(businessData)
      await this.userModel.findByIdAndUpdate(businessData.user,{business_document : "submitted"})
      return newData
    } catch (error) {
      throw new BadRequestException(error.message ||"An error occurred while creating business")
    }
  }

  async findBusinessAndUpdate(searchParam : object, update : object){
    try {
      const businessDetails = await this.businessModel.findOneAndUpdate(searchParam,update,{new : true})
      return businessDetails
    } catch (error) {
      console.log(error)
      throw new HttpException('AN error occurred while fetching data',400)
    }
  }

  async findBusinesses({filter,page,limit}:{filter ?:string, page : number, limit : number}){
    try {
      const skip = (page - 1) * limit;
      const query: any = {};

      if (filter) {
        query._id = filter; 
      }

      const [users, total] = await Promise.all([
        this.businessModel.find(query).skip(skip).limit(limit),
        this.businessModel.countDocuments(query),
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
      throw new HttpException(error.message || 'Failed to fetch businesses', error.status || 500);
    }
  }

  async findOneBusiness (param : object){
    try {
      const result = await this.businessModel.findOne(param)
      return result
    } catch (error) {
      throw new BadRequestException("An error occurred while fetching business details")
    }
  }


  async verifyUser(id: string): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(
      id,
      { account_status: 'verified' },
      { new: true },
    );
  }

  async declineUser(id: string): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(
      id,
      {account_status: 'inactive' },
      { new: true },
    );
  }

  async editUser(id: string, updateData: UpdateUserDto): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(id, updateData, { new: true });
  }

  // async updateAccountConfig(id: string, config: AccountConfigDto): Promise<User> {
  //   return this.userModel.findByIdAndUpdate(id, config, { new: true });
  // }

  async blockUser(id: string): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(
      id,
      { account_status: 'inactive' },
      { new: true },
    );
  }
}