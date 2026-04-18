import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';
import { UserRole } from './user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 255 })
  email!: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash!: string;

  @Column({ name: 'full_name', length: 120 })
  fullName!: string;

  /** Legal / display business name (caterer workspace). */
  @Column({ name: 'business_name', type: 'varchar', length: 120, nullable: true })
  businessName!: string | null;

  /** E.164-style dial prefix only, e.g. +91, +1 */
  @Column({ name: 'phone_country_code', type: 'varchar', length: 8, nullable: true })
  phoneCountryCode!: string | null;

  /** National number (digits), without country code. */
  @Column({ name: 'phone_number', type: 'varchar', length: 24, nullable: true })
  phoneNumber!: string | null;

  @Column({ type: 'varchar', length: 20, default: UserRole.CATERER })
  role!: UserRole;

  @ManyToOne(() => Tenant, (t) => t.users, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant | null;

  /** Tenant this user owns as primary caterer (`tenants.user_id`). */
  @OneToOne(() => Tenant, (t) => t.ownerUser)
  ownedTenant!: Tenant | null;

  @Column({ name: 'email_verified_at', type: 'datetime', precision: 6, nullable: true })
  emailVerifiedAt!: Date | null;

  @Column({ name: 'email_verification_token', type: 'varchar', length: 64, nullable: true, unique: true })
  emailVerificationToken!: string | null;

  @Column({ name: 'email_verification_expires_at', type: 'datetime', precision: 6, nullable: true })
  emailVerificationExpiresAt!: Date | null;

  @Column({ name: 'email_verification_otp_hash', type: 'varchar', length: 255, nullable: true })
  emailVerificationOtpHash!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;
}
