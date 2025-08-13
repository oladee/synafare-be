import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, UseGuards, UseInterceptors, HttpStatus, BadRequestException, Req, UploadedFiles, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FirebaseAuthGuard } from 'src/auth/auth.guard';
import { Request } from 'express';
import { FileSizeValidationPipe } from 'src/auth/auth.service';
import { Roles } from 'src/auth/roles.decorator';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @HttpCode(HttpStatus.OK)
  @Post('add')
  @UseGuards(FirebaseAuthGuard)
  @Roles('distributor', 'supplier')
  @UseInterceptors(
  FileFieldsInterceptor(
    [
      { name: 'product_image', maxCount: 5 },
    ],
    {
      dest: 'uploads/',
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new BadRequestException('Invalid file type.'), false);
        }
        cb(null, true);
      },
    },
  ),)

  create(@Body() createInventoryDto: CreateInventoryDto,@Req() req : Request,@UploadedFiles(new FileSizeValidationPipe()) files : {
    product_image: Express.Multer.File[];
  }) {
    const uploadFiles = {
      product_image: files.product_image,
    };
    return this.inventoryService.create(createInventoryDto, req,uploadFiles.product_image);
  }


  @HttpCode(HttpStatus.OK)
  @Patch('edit/:id')
  @UseGuards(FirebaseAuthGuard)
  @Roles('distributor', 'supplier')
  @UseInterceptors(
  FileFieldsInterceptor(
    [
      { name: 'product_image', maxCount: 5 },
    ],
    {
      dest: 'uploads/',
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(new BadRequestException('Invalid file type.'), false);
        }
        cb(null, true);
      },
    },
  ),)
  editInventory(@Param('id') id : string,@Body() UpdateInventoryDto: UpdateInventoryDto,@Req() req : Request,@UploadedFiles(new FileSizeValidationPipe()) files : {
    product_image: Express.Multer.File[];
  }) {
    const uploadFiles = {
      product_image: files.product_image,
    };
    return this.inventoryService.edit(UpdateInventoryDto,req,id,uploadFiles.product_image);
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('my-inventory')
  @Roles('distributor', 'supplier')
  myInventory(@Req() req : Request, @Query('id') id?: string,@Query('status') status?: string,@Query('category') category?: string,
  @Query('page') page = 1,
  @Query('limit') limit = 10) {
    console.log('gddf')
    return this.inventoryService.myInventory({id,status,category,limit,page,req});
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.inventoryService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateInventoryDto: UpdateInventoryDto) {
    return this.inventoryService.update(+id, updateInventoryDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inventoryService.remove(+id);
  }
}
