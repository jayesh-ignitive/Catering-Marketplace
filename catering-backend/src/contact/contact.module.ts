import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../tenant/tenant.entity';
import { ContactSubmission } from './contact-submission.entity';
import { ContactController } from './contact.controller';
import { ContactService } from './contact.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContactSubmission, Tenant])],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
