import {v2 as cloudinary} from 'cloudinary'
import { ConfigService } from '@nestjs/config'

export const CloudinaryConfig = {
    provide : 'CLOUDINARY',
    useFactory : (configService: ConfigService) => {
      cloudinary.config({
        cloud_name: configService.get<string>('CLOUDI_NAME'),
        api_key: configService.get<string>('CLOUDI_API_KEY'),
        api_secret: configService.get<string>('CLOUDI_API_SECRET'),
      });
      return cloudinary;
    },
    inject: [ConfigService],
}

