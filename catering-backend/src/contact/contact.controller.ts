import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  /** Public: contact form submissions for sales & support. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  submit(@Body() body: CreateContactDto) {
    return this.contact.create(body);
  }
}
