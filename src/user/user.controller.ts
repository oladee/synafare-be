import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { Types } from 'mongoose';

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

  

}