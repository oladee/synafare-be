import { HttpException, Injectable } from '@nestjs/common';
import { documentLookup } from './dto/lookup.dto';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
@Injectable()
export class IdlookupService {
  readonly da_base_url: string;
  readonly da_config: object ;

  constructor(private readonly configService: ConfigService) {
    const isDev = this.configService.get<string>('NODE_ENV') === 'dev';
    this.da_base_url =  isDev ? String(this.configService.get<string>('DOJA_BASE_TEST')) : String(this.configService.get<string>('DOJA_BASE_PROD'))

    this.da_config = {
      headers: {
        Authorization: `${
          isDev
            ? this.configService.get<string>('DOJA_SK_TEST')
            : this.configService.get<string>('DOJA_SK_PROD')
        }`,
        AppId : this.configService.get<string>('DOJA_APP_ID')
      },
    };
  }

    async lookupDocuments (doc_data : documentLookup){
        try {
          let url : string;
          switch(doc_data.doctype){
              case "nin":
                url = "nin"
                break;
              case "dl":
                url = "dl"
                break;
              case "bvn":
                url = "bvn/full"
                break;
              case "vin":
                url = "vin"
                break;
              case "cac":
                url = "cac/basic"
                break;
                default:
              throw new Error(`Invalid document type`);
          }
          let query = '';

          if (doc_data.doctype === 'cac') {
            query = `rc_number=${doc_data.doc_number}&company_type=${doc_data.company_name}`;
          } else {
            query = `${doc_data.doctype}=${doc_data.doc_number}`;
          }
          await axios.get(`${this.da_base_url}${url}/?${query}`,this.da_config)

          return {message : "User Id validated"}

        } catch (error) {
          console.log(error)
          throw new HttpException(`Looks like your ${doc_data.doctype} is incorrect`, error.status || 400)
        }
    }
}
