import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { CustomerService } from "./customer.service";
import { FirebaseAuthGuard } from "src/auth/auth.guard";
import { Request } from "express";
import { AddCustomerDto } from "./dto/add-customer.dto";



@Controller('customer')
export class CustomerController {
    constructor(private readonly customerService: CustomerService) {}

    @UseGuards(FirebaseAuthGuard)
    @Get('getcustomers')
    getcustomers(@Req() req : Request, @Query('id') filter?: string,
        @Query('page') page = 1,
        @Query('limit') limit = 10){
            return this.customerService.getCustomers({filter, page, limit,req})
    }


    @UseGuards(FirebaseAuthGuard)
    @Post('add')
    addcustomer(@Req() req : Request, @Body() data : AddCustomerDto){
        return this.customerService.addCustomer(req,data)
    }

    @UseGuards(FirebaseAuthGuard)
    @Delete('delete/:id')
    deletecustomer(@Req() req : Request, @Param('id') cus_id : string){
        return this.customerService.deleteCustomer(req,cus_id)
    }


}