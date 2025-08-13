import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { FirebaseModule } from 'src/utils/firebase/firebase.module';
import { UserModule } from 'src/user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Catalogue, CatalogueSchema, Inventory, InventorySchema } from './entities/inventory.entity';
import { CloudinaryConfig } from 'src/config/cloudinary.config';

@Module({
  imports : [
    MongooseModule.forFeature([{name : Inventory.name, schema :  InventorySchema},{name : Catalogue.name, schema : CatalogueSchema}]),
    FirebaseModule, UserModule
  ],
  controllers: [InventoryController],
  providers: [InventoryService,CloudinaryConfig],
})
export class InventoryModule {}
