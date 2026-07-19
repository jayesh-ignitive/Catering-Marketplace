import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';
import { ContactSubmission } from './contact-submission.entity';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactSubmission)
    private readonly submissions: Repository<ContactSubmission>,
    @InjectRepository(Tenant)
    private readonly tenants: Repository<Tenant>,
  ) {}

  async create(dto: CreateContactDto): Promise<{ id: string }> {
    let tenantId: string | null = null;
    if (dto.tenantId) {
      const tenant = await this.tenants.findOne({ where: { id: dto.tenantId } });
      if (!tenant) {
        throw new BadRequestException('Caterer not found');
      }
      tenantId = tenant.id;
    }

    const row = this.submissions.create({
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone?.trim() ? dto.phone.trim() : null,
      subject: dto.subject.trim(),
      message: dto.message.trim(),
      tenantId,
    });
    const saved = await this.submissions.save(row);
    return { id: saved.id };
  }
}
