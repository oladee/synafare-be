import {
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notification.service';
import { Types } from 'mongoose';
import { Request } from 'express';
import { FirebaseAuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/roles.decorator';

@UseGuards(FirebaseAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Send loan overdue reminder
   */
  @Roles('admin')
  @Post('loan-reminder/:userId')
  async sendLoanReminder(
    @Param('userId') userId: Types.ObjectId,
    @Body('description') description?: string,
  ) {
    const user = userId
    return this.notificationsService.sendLoanOverdueReminder(user, description);
  }

  /**
   * Toggle read/unread
   */
  @Patch(':id/read')
  async toggleRead(
    @Param('id') id: string,
    @Body('is_read') isRead: boolean,
    @Req() req : Request
  ) {
    return this.notificationsService.toggleReadStatus(id, isRead,req);
  }

  /**
   * Clear notifications
   */
  @Delete()
  async clearNotifications(@Body('ids') ids: string[]) {
    return this.notificationsService.clearNotifications(ids);
  }

  /**
   * Get all notifications for a user
   */
  @Get('user')
  async getUserNotifications(@Req() req : Request) {
    return this.notificationsService.getUserNotifications(req);
  }
}
