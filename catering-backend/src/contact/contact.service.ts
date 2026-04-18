import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactSubmission } from './contact-submission.entity';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactSubmission)
    private readonly submissions: Repository<ContactSubmission>,
  ) {}

  async create(dto: CreateContactDto): Promise<{ id: string }> {
    const row = this.submissions.create({
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone?.trim() ? dto.phone.trim() : null,
      subject: dto.subject.trim(),
      message: dto.message.trim(),
    });
    const saved = await this.submissions.save(row);
    return { id: saved.id };
  }
}
