import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TenantInvoice } from './tenant-invoice.entity';

@Entity('orders')
export class TenantOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'customer_name', length: 160 })
  customerName!: string;

  @Column({ length: 32, default: 'pending' })
  status!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total!: string;

  @Column({ name: 'placed_at', type: 'datetime', precision: 6 })
  placedAt!: Date;

  @OneToMany(() => TenantInvoice, (inv) => inv.order)
  invoices!: TenantInvoice[];

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;
}
