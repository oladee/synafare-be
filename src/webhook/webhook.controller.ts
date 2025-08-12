import { Body, Controller, Post, Req } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { Request } from 'express';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('nomba/live')
  nombaTestWebhook(@Body() data,@Req() req: Request) {  
    return this.webhookService.nombaLiveWebhook(data,req);
  }
}
