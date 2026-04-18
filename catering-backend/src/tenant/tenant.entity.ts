import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

export type TenantProvisionStatus = 'pending' | 'ready' | 'failed';

@Entity('tenants')
export class Tenant {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ length: 120 })
  name!: string;

  @Column({ unique: true, length: 80 })
  slug!: string;

  /** Host label for workspace URL, e.g. `acme` → acme.yourdomain.com */
  @Column({ type: 'varchar', length: 63, unique: true, nullable: true })
  subdomain!: string | null;

  /** Dedicated MySQL database for menu, staff, orders, invoices (name only, not DSN). */
  @Column({ name: 'db_name', type: 'varchar', length: 64, unique: true, nullable: true })
  dbName!: string | null;

  @Column({ name: 'provision_status', type: 'varchar', length: 16, default: 'pending' })
  provisionStatus!: TenantProvisionStatus;

  @Column({ name: 'profile_published', type: 'boolean', default: false })
  profilePublished!: boolean;

  /** Website sections and display options (JSON). */
  @Column({ name: 'profile_options', type: 'json', nullable: true })
  profileOptions!: Record<string, unknown> | null;

  /** Primary caterer user linked to this workspace (public profile / account owner). */
  @ManyToOne(() => User, (u) => u.ownedTenant, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  ownerUser!: User | null;

  @OneToMany(() => User, (u) => u.tenant)
  users!: User[];

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;
}
