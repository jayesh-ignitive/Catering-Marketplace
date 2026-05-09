import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AttributeType } from './attribute-type.enum';
import { AttributeTranslation } from './attribute-translation.entity';

@Entity('attributes')
export class Attribute {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({
    type: 'enum',
    enum: AttributeType,
  })
  type!: AttributeType;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image!: string | null;

  @Column({ name: 'is_searchable', type: 'boolean', default: true })
  isSearchable!: boolean;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt!: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'datetime',
    precision: 6,
    nullable: true,
  })
  deletedAt!: Date | null;

  @OneToMany(() => AttributeTranslation, (t) => t.attribute, {
    cascade: false,
  })
  translations!: AttributeTranslation[];
}
