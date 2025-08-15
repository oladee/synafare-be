import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Schema, Types } from 'mongoose';
import { Notification } from './entities/user.entity';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { Request } from 'express';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,private readonly userService : UserService
  ) {}

  /**
   * Send a loan overdue reminder to a user
   */
  async sendLoanOverdueReminder(user: Types.ObjectId, description?: string) {
    try {
        const user_exist = await this.userService.findOne({id : user})
        if (!Types.ObjectId.isValid(user) || !user_exist){
          throw new BadRequestException("User account not found")
        }
        
        const notification = new this.notificationModel({
        notification_type: 'loan_reminder',
        notification_title: 'Loan Payment Overdue',
        is_read: false,
        notification_description:
            description || 'Your loan payment is overdue. Please take action.',
        notification_date: new Date(),
        user,
        });
        return notification.save();
    } catch (error) {
        console.log(error)
        throw new BadRequestException(error.message || "An error occurred while sending notification")
    }
    
  }

  /**
   * Toggle a notification's read status
   */
  async toggleReadStatus(notificationId: string, isRead: boolean, req : Request) {
    const {id} = req.user
    try {
        const updated = await this.notificationModel.findOneAndUpdate(
            {_id : notificationId, user : id},
            { is_read: isRead },
            { new: true },
        );
        if (!updated) throw new NotFoundException('Notification not found');
        return updated;
    } catch (error) {
        console.log(error)
        throw new BadRequestException(error.message || "An error occurred while reading your message")
    }
    
  }

  /**
   * Clear (delete) one or many notifications
   */
  async clearNotifications(notificationIds: string[]) {
    const objectIds = notificationIds.map((id) => new Types.ObjectId(id));
    const result = await this.notificationModel.deleteMany({
      _id: { $in: objectIds },
    });
    return { deletedCount: result.deletedCount };
  }

  /**
   * Get all notifications for a user
   */
  async getUserNotifications(req : Request) {
    const {id} = req.user
    return this.notificationModel
      .find({ user: id })
      .sort({ notification_date: -1 })
      .exec();
  }
}
