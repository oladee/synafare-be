import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { Types } from 'mongoose';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('allusers')
  findAll(@Query('id') filter?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10) {
    const sanitizedLimit = Math.min(Math.max(+limit || 10, 1), 100); // max 100 users per page
    const sanitizedPage = Math.max(+page || 1, 1);
    return this.userService.findAll({ filter, page: sanitizedPage, limit: sanitizedLimit });
  }

  @Get('allbusinesses')
  findBusinesses(@Query('id') filter?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10) {

    const sanitizedLimit = Math.min(Math.max(+limit || 10, 1), 100); // max 100 users per page
    const sanitizedPage = Math.max(+page || 1, 1);
    return this.userService.findBusinesses({ filter, page: sanitizedPage, limit: sanitizedLimit });
  }

  @Get(':id')
  findOne(@Param('id') id: Types.ObjectId) {
    return this.userService.findOne({id});
  }

  @Delete(':id')
  deleteOne(@Param('id') id:string) {
    return this.userService.deleteUser(id);
  }

  @Patch(':id/verify')
  async verifyUser(@Param('id') id: string) {
    return this.userService.verifyUser(id);
  }

  @Patch(':id/decline')
  async declineUser(@Param('id') id: string) {
    return this.userService.declineUser(id);
  }

  @Patch(':id')
  async editUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.editUser(id, dto);
  }

  // @Patch(':id/account-config')
  // async accountConfig(@Param('id') id: string, @Body() dto: AccountConfigDto) {
  //   return this.userService.updateAccountConfig(id, dto);
  // }

  @Patch(':id/block')
  async blockUser(@Param('id') id: string) {
    return this.userService.blockUser(id);
  }

  

}