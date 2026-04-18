import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserRole } from '../user/user-role.enum';
import { User } from '../user/user.entity';
import type { CreateStaffDto } from './dto/create-staff.dto';
import type { UpdateStaffDto } from './dto/update-staff.dto';

const BCRYPT_ROUNDS = 12;

export type StaffRow = {
  id: string;
  email: string;
  fullName: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AdminStaffService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  private toRow(user: User): StaffRow {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async list(): Promise<StaffRow[]> {
    const rows = await this.users.find({
      where: { role: UserRole.ADMIN },
      order: { createdAt: 'DESC' },
    });
    return rows.map((u) => this.toRow(u));
  }

  async findOne(id: string): Promise<StaffRow> {
    const user = await this.users.findOne({ where: { id, role: UserRole.ADMIN } });
    if (!user) {
      throw new NotFoundException('Staff member not found');
    }
    return this.toRow(user);
  }

  async create(dto: CreateStaffDto): Promise<StaffRow> {
    const email = dto.email.toLowerCase();
    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const now = new Date();
    const user = this.users.create({
      email,
      passwordHash,
      fullName: dto.fullName.trim(),
      role: UserRole.ADMIN,
      emailVerifiedAt: now,
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
      emailVerificationOtpHash: null,
    });
    await this.users.save(user);
    return this.toRow(user);
  }

  async update(id: string, dto: UpdateStaffDto): Promise<StaffRow> {
    if (dto.email === undefined && dto.fullName === undefined && dto.password === undefined) {
      throw new BadRequestException('Provide at least one field to update');
    }
    const user = await this.users.findOne({ where: { id, role: UserRole.ADMIN } });
    if (!user) {
      throw new NotFoundException('Staff member not found');
    }
    if (dto.email !== undefined) {
      const email = dto.email.toLowerCase();
      const taken = await this.users.findOne({ where: { email } });
      if (taken && taken.id !== id) {
        throw new ConflictException('An account with this email already exists');
      }
      user.email = email;
    }
    if (dto.fullName !== undefined) {
      user.fullName = dto.fullName.trim();
    }
    if (dto.password !== undefined) {
      user.passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    }
    await this.users.save(user);
    return this.toRow(user);
  }

  async remove(targetId: string, actorId: string): Promise<{ ok: true }> {
    if (targetId === actorId) {
      throw new BadRequestException('You cannot remove your own account');
    }
    const adminCount = await this.users.count({ where: { role: UserRole.ADMIN } });
    if (adminCount <= 1) {
      throw new BadRequestException('Cannot remove the last platform administrator');
    }
    const user = await this.users.findOne({ where: { id: targetId, role: UserRole.ADMIN } });
    if (!user) {
      throw new NotFoundException('Staff member not found');
    }
    await this.users.remove(user);
    return { ok: true };
  }
}
